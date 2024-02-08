import {
  getCustomProperty,
  incrementCustomProperty,
  setCustomProperty,
} from "./updateCustomProperty.js"

const SPEED = 0.05
// const groundElems = document.querySelectorAll("[data-ground]")
// console.log(groundElems)


export function setupGround(groundElems) {
  if (groundElems[0] && groundElems[1]) {
    setCustomProperty(groundElems[0], "--left", 0);
    setCustomProperty(groundElems[1], "--left", 300);
  }
}

export function updateGround(delta, speedScale, groundElems) {
  groundElems.forEach(ground => {
    incrementCustomProperty(ground, "--left", delta * speedScale * SPEED * -1)

    if (getCustomProperty(ground, "--left") <= -300) {
      incrementCustomProperty(ground, "--left", 600)
    }
  })
}
