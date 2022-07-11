const body = document.body;
const grid = document.getElementById("grid");

const GRID_SIZE = 720;
const GRID_DIMENSION = 30;
let CRITICAL_ATTR = 3;
const DIMENSION = GRID_SIZE / GRID_DIMENSION;
let DEFAULT_OPTIONS = [];
let PRNG = new Math.seedrandom(Math.random());

class ImageOption {
    static get DIMENSION() {
        return DIMENSION;
    }
    constructor(rotation, image_src, socket_config) {
        this.image_src = image_src;
        this.rotation = rotation;
        this.socket_config = socket_config;
        this.options = new Array(4).fill(null).map(() => new Array());
    }

    formImage = (i, j) => {
        const image = document.createElement("img");
        image.src = this.image_src;
        image.classList.add("image");
        image.style = `width: ${ImageOption.DIMENSION}px; height: ${
            ImageOption.DIMENSION
        }px; transform: translate(${j * ImageOption.DIMENSION}px, ${
            i * ImageOption.DIMENSION
        }px) rotate(${this.rotation * 90}deg);`;

        return image;
    };

    static analyze = () => {
        for (let i = 0; i < DEFAULT_OPTIONS.length; ++i) {
            for (let j = 0; j <= i; ++j) {
                for (let d = 0; d < 4; ++d) {
                    if (
                        DEFAULT_OPTIONS[i].socket_config[d] ===
                        DEFAULT_OPTIONS[j].socket_config[(d + 2) % 4]
                    ) {
                        DEFAULT_OPTIONS[i].options[d].push(j);
                        if (i !== j)
                            DEFAULT_OPTIONS[j].options[(d + 2) % 4].push(i);
                    }
                }
            }
        }
    };
}

const UNDEFINED_BLOCK = new ImageOption(0, "./svg/undefined.svg", []);

class Block {
    constructor(i, j) {
        this.options = new Array(DEFAULT_OPTIONS.length)
            .fill(0)
            .map((_, idx) => idx);
        this.i = i;
        this.j = j;
        this.image = UNDEFINED_BLOCK.formImage(i, j);
        this.collapsed = false;
        this.selectedImageIdx = -1;

        this.rendered = false;
    }

    intialize = (power = "strong") => {
        if (power === "strong") {
            grid.removeChild(this.image);
            this.rendered = false;
            this.image = UNDEFINED_BLOCK.formImage(this.i, this.j);

            this.collapsed = false;
            this.selectedImageIdx = -1;
        }
        this.options = new Array(DEFAULT_OPTIONS.length)
            .fill(0)
            .map((_, idx) => idx);
    };

    render = () => {
        if (!this.rendered) grid.appendChild(this.image);
        this.rendered = true;
    };

    setImage = () => {
        this.selectedImageIdx =
            this.options[Math.floor(PRNG() * this.options.length)];

        if (this.options.length === 0) {
            this.selectedImageIdx = -1;
            throw "Zero Hogaya";
        }
        try {
            grid.removeChild(this.image);
        } catch (e) {
            console.log("wow");
        }
        this.rendered = false;
        this.collapsed = true;

        this.image = DEFAULT_OPTIONS[this.selectedImageIdx].formImage(
            this.i,
            this.j
        );
    };
}

const intialize = (blocks, power) => {
    for (const block of blocks) {
        block.intialize(power);
    }
};

const fetchImageDataJSON = async (sample) => {
    const response = await fetch(`./data/${sample}/image_data.json`);
    const data = await response.json();
    return data;
};

const preloadImages = async () => {
    for (const image of DEFAULT_OPTIONS) {
        await new Promise((resolve, reject) => {
            const img = image.formImage(0, 0);
            img.addEventListener("load", () => resolve());
            img.addEventListener("error", (err) => reject(err));
        });
    }
};

const invert = (num) => {
    let temp = 0;
    for (let i = 0; i < CRITICAL_ATTR; ++i) {
        temp *= 10;
        temp += num % 10;
        num = Math.floor(num / 10);
    }
    return temp;
};

const rotateArray = (array, rotations) => {
    const copy = [...array];
    while (rotations-- > 0) {
        copy.unshift(invert(copy.pop()));
        copy[2] = invert(copy[2]);
    }

    return copy;
};

const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
];

const isValid = (i, j) => {
    return 0 <= i && i < GRID_DIMENSION && 0 <= j && j < GRID_DIMENSION;
};

const main = async () => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });

    const JSONdata = await fetchImageDataJSON(params.sample);
    const BASE_IMAGE_OPTIONS = JSONdata.images;
    CRITICAL_ATTR = JSONdata.critical_attributes;
    for (const image of BASE_IMAGE_OPTIONS) {
        for (const rotation of image.rotations) {
            DEFAULT_OPTIONS.push(
                new ImageOption(
                    rotation,
                    image.image_src,
                    rotateArray(image.socket_config, rotation)
                )
            );
        }
    }
    const blocks = new Array(GRID_DIMENSION * GRID_DIMENSION)
        .fill(null)
        .map(
            (_, j) =>
                new Block(Math.floor(j / GRID_DIMENSION), j % GRID_DIMENSION)
        );
    ImageOption.analyze();
    await preloadImages();

    const gridRender = async () => {
        for (const block of blocks) {
            block.render();
        }
        await new Promise((r) => setTimeout(r, 1));
    };

    const propagation = () => {
        for (const block of blocks) {
            if (block.collapsed) continue;
            const valid_count = new Array(4)
                .fill(null)
                .map((_) => new Array(DEFAULT_OPTIONS.length).fill(false));
            for (let d = 0; d < 4; ++d) {
                const ni = block.i + directions[d][0],
                    nj = block.j + directions[d][1];
                if (
                    isValid(ni, nj)
                    // blocks[ni * GRID_DIMENSION + nj].collapsed
                ) {
                    if (blocks[ni * GRID_DIMENSION + nj].collapsed)
                        DEFAULT_OPTIONS[
                            blocks[ni * GRID_DIMENSION + nj].selectedImageIdx
                        ].options[(d + 2) % 4].forEach((x) => {
                            valid_count[d][x] = true;
                        });
                    else {
                        blocks[ni * GRID_DIMENSION + nj].options.forEach(
                            (y) => {
                                DEFAULT_OPTIONS[y].options[(d + 2) % 4].forEach(
                                    (x) => {
                                        valid_count[d][x] = true;
                                    }
                                );
                            }
                        );
                    }
                } else {
                    for (let x = 0; x < DEFAULT_OPTIONS.length; ++x)
                        valid_count[d][x]++;
                }
            }
            block.options = [];
            for (let idx = 0; idx < DEFAULT_OPTIONS.length; ++idx) {
                if (
                    valid_count[0][idx] &&
                    valid_count[1][idx] &&
                    valid_count[2][idx] &&
                    valid_count[3][idx]
                )
                    block.options.push(idx);
            }
            // if (block.options.length === 0) console.log(valid_count);
        }

        let sampleBlocks = blocks.filter((block) => !block.collapsed);
        sampleBlocks.sort((a, b) => a.options.length - b.options.length);
        sampleBlocks = sampleBlocks.filter(
            (block) => sampleBlocks[0].options.length === block.options.length
        );

        const randomBlock =
            sampleBlocks[Math.floor(PRNG() * sampleBlocks.length)];

        try {
            randomBlock.setImage();
        } catch (e) {
            console.error(e);
            console.log(randomBlock);
            return { success: false, Coord: [] };
        }
        return { success: true, Coord: [randomBlock.i, randomBlock.j] };
    };

    let propagations = 0;
    let solved = false;
    const solve = async () => {
        if (propagations === GRID_DIMENSION * GRID_DIMENSION) return true;

        const data = propagation();
        if (!data.success) return false;
        await gridRender();

        propagations++;
        const result = await solve();
        if (result) return true;

        propagations--;
        blocks[data.Coord[0] * GRID_DIMENSION + data.Coord[1]].intialize();
        intialize(blocks, "easy");
        PRNG = new Math.seedrandom(`${PRNG()}`);

        await gridRender();
        return await solve();
    };

    while (!solved) {
        gridRender();
        solved = await solve();
        if (!solved) intialize(blocks, "strong");
    }
};

main();
