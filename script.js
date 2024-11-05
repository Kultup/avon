let pdfDoc = null,
    pageNum = 1,
    pageIsRendering = false,
    pageNumIsPending = null;

const canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');

document.getElementById('pdf-container').appendChild(canvas);

// Укажите путь к worker для pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

// Загрузите PDF-документ
pdfjsLib.getDocument('https://raw.githubusercontent.com/Kultup/avon/main/catalogue.pdf').promise.then(pdfDoc_ => {
    console.log("PDF загружен успешно");
    pdfDoc = pdfDoc_;
    renderPage(pageNum);
}).catch(error => {
    console.error("Ошибка при загрузке PDF: ", error);
});

// Функция для вычисления масштаба на основе размеров контейнера
const calculateScale = (viewportWidth, viewportHeight, isMobile) => {
    const container = document.getElementById('pdf-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const widthScale = containerWidth / viewportWidth;
    const heightScale = containerHeight / viewportHeight;

    // Увеличьте масштаб на мобильных устройствах для лучшей читаемости
    let scale = Math.min(widthScale, heightScale);
    if (isMobile) {
        scale *= 1.5;
    }
    return scale;
};

// Функция для отображения страницы
const renderPage = num => {
    pageIsRendering = true;

    pdfDoc.getPage(num).then(page => {
        const isMobile = window.innerWidth <= 768;
        const viewport = page.getViewport({ scale: 1 });
        const scale = calculateScale(viewport.width, viewport.height, isMobile);
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderCtx = {
            canvasContext: ctx,
            viewport: scaledViewport
        };

        const renderTask = page.render(renderCtx);

        renderTask.promise.then(() => {
            pageIsRendering = false;

            if (pageNumIsPending !== null) {
                renderPage(pageNumIsPending);
                pageNumIsPending = null;
            }

            document.getElementById('page-info').textContent = `Page ${num} of ${pdfDoc.numPages}`;
        });
    });
};

// Очередь для рендеринга страниц
const queueRenderPage = num => {
    if (pageIsRendering) {
        pageNumIsPending = num;
    } else {
        renderPage(num);
    }
};

// Обработчики для кнопок
document.getElementById('prev-page').addEventListener('click', () => {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
});

document.getElementById('next-page').addEventListener('click', () => {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
});
