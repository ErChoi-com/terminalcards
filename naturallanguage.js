const sentenceList = [];

async function trainModel(sentences) {
    if (!Array.isArray(sentences)) {
        return("Must return an array");
    }

    else if (sentences.length < 4) {
        return("Must provide at least 4 words");
    }

    const words = Array.from(new Set(sentences.join(" ").split(" ")));
    const wordIndex = {};
    const indexOfWord = {};
    const sequenceLength = 2;

    words.forEach((word, index) => {
        indexOfWord[word] = index;
        wordIndex[index] = word;
    });

    const xsData = [];
    const ysData = [];

    sentences.forEach(sentence => {
        const fragments = sentence.split(" ");
        for (let i = 0; i <= fragments.length - sequenceLength - 1, i++) {
            const seq = fragments.slice(i, i + sequenceLength).map(word => wordIndex[word]);
            const nextWord = wordIndex[fragments[i + sequenceLength]];
            xsData.push(seq);
            ysData.push(nextWord);
        }
    });

    const xs = tf.tensor2d(xsData, [xsData.length, sequenceLength]);
    const ys = tf.oneHot(tf.tensor1d(ysData, "int32"), words.length);

    const model = tf.sequential();
    model.add(tf.layers.embedding({inputDim: words.length, outputDim: 16, inputLength: sequenceLength}));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({units: 16, activation: 'softmax'}));
    


    /* wordList = sentences;
    const model = tf.sequential();
    const wordIndex = {};
    const indexOfWord = {};

    sentences.forEach((word, index) => {
        indexOfWord[word] = index;
        wordIndex[index] = word;
    })

    const xs = tf.tensor2d([wordIndex[sentences[0]]], [wordIndex[sentences[2]]]); //2d sensor
    const ys = tf.oneHot(tf.tensor1d([wordIndex[sentences[1]]], [wordIndex[sentences[3]]], dtype='int32'), sentences.length);

    model.add(tf.layers.embeddings({inputDim: sentences.length, outputDim: Math.ceil(sentences.length / 2) + 6, inputLength: 1}));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({units:16, activation:'relu'}));
    model.add(tf.layers.dense({units:sentences.length, activation: 'softmax'}));

    model.compile({optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy']});

    await model.fit(xs, ys, {epochs: 200, verbose: 0});

    const input = tf.tensor2d()
*/ 
}