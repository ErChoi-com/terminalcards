function gaussianProb(mean, stdev, value) {
    const gaussianSample = 1 / stdev * Math.sqrt(2 * Math.PI) * Math.exp(-0.5 * Math.pow((value - mean), 2) / Math.pow(stdev, 2));
    return gaussianSample;
}

function gaussianRender(x, y, mean, stdev) {
    let c;
    let colorMatrix = [];
    for (let j = 0; j < y; j++) {
        colorMatrix[j] = [];
        for (let i = 0; i < x; i++) {
            c = mean + stdev * Math.random();
            colorMatrix[j][i] = {r : c, g : c, b : c};
        }
    }
    return colorMatrix;
}

export {gaussianRender};