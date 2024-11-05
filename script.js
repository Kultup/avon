let pdfDoc = null,
    pageNum = 1,
    pageIsRendering = false,
    pageNumIsPending = null;

const canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');

document.getElementById('pdf-container').appendChild(canvas);

// Укажите путь к worker для pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

// Function to calculate the scale based on container size
const calculateScale = (viewportWidth, viewportHeight, isMobile) => {
    const container = document.getElementById('pdf-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const widthScale = containerWidth / viewportWidth;
    const heightScale = containerHeight / viewportHeight;

    // Increase scale on mobile devices for better readability
    let scale = Math.min(widthScale, heightScale);
    if (isMobile) {
        scale *= 1.5;  // Increase scale for mobile devices
    }
    return scale;
};

// Render the page
const renderPage = num => {
    pageIsRendering = true;

    // Get page
    pdfDoc.getPage(num).then(page => {
        const isMobile = window.innerWidth <= 768;  // Check if the device is mobile
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

        // Wait for rendering to finish
        renderTask.promise.then(() => {
            pageIsRendering = false;

            if (pageNumIsPending !== null) {
                renderPage(pageNumIsPending);
                pageNumIsPending = null;
            }

            // Update page info
            document.getElementById('page-info').textContent = `Page ${num} of ${pdfDoc.numPages}`;
        });
    });
};

// Check for pages rendering
const queueRenderPage = num => {
    if (pageIsRendering) {
        pageNumIsPending = num;
    } else {
        renderPage(num);
    }
};

// Show Prev Page
document.getElementById('prev-page').addEventListener('click', () => {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
});

// Show Next Page
document.getElementById('next-page').addEventListener('click', () => {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
});

// Get Document
pdfjsLib.getDocument('catalogue.pdf').promise.then(pdfDoc_ => {
    console.log("PDF loaded successfully");
    pdfDoc = pdfDoc_;
    renderPage(pageNum);
}).catch(error => {
    console.error("Error loading PDF: ", error);
});
