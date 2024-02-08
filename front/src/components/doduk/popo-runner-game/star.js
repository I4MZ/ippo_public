import {
  setCustomProperty,
  incrementCustomProperty,
  getCustomProperty,
} from "./updateCustomProperty.js"

const SPEED = 0.05
const STAR_INTERVAL_MIN = 1800
const STAR_INTERVAL_MAX = 3200
// const worldElem = document.querySelector("[data-world]")

let nextStarTime
export function setupStar() {
  nextStarTime = STAR_INTERVAL_MIN
  document.querySelectorAll("[data-star]").forEach(star => {
    star.remove()
  })
}

export function updateStar(delta, speedScale, worldElem) {
  document.querySelectorAll("[data-star]").forEach(star => {
    incrementCustomProperty(star, "--left", delta * speedScale * SPEED * -1)
    if (getCustomProperty(star, "--left") <= -100) {
      star.remove()
    }
  })

  if (nextStarTime <= 0) {
    createStar(worldElem)
    nextStarTime =
      randomNumberBetween(STAR_INTERVAL_MIN, STAR_INTERVAL_MAX) / speedScale
  }
  nextStarTime -= delta
}

export function getStarRects() {
  return [...document.querySelectorAll("[data-star]")].map(star => {
    return star.getBoundingClientRect()
  })
}

function createStar(worldElem) {
  const star = document.createElement("img")
  star.dataset.star = true
  star.src = "imgs/star.png"
  star.classList.add("star")
  setCustomProperty(star, "--left", 100)
  worldElem.append(star)
}

function randomNumberBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}
