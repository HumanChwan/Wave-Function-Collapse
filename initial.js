const box = document.querySelector(".choice-box");

const DATA = ["2DWorld", "Circuit", "Pipe", "Tunnel"];
const UNSTABLE = ["2DWorld"];

DATA.forEach((sample) => {
    const button = document.createElement("a");
    button.classList.add("button");
    button.href = `./render.html?sample=${sample}`;
    button.innerText = `${sample}${
        UNSTABLE.includes(sample) ? " (UNSTABLE)" : ""
    }`;

    box.appendChild(button);
});
