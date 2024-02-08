import {
  incrementCustomProperty,
  setCustomProperty,
  getCustomProperty,
} from "./updateCustomProperty.js"

// const popoElem = document.querySelector("[data-popo]")
const JUMP_SPEED = 0.31
const GRAVITY = 0.0008
const POPO_FRAME_COUNT = 2
const FRAME_TIME = 100

let isJumping
let popoFrame
let currentFrameTime
let yVelocity
export function setupPopo(popoElem, modal) {
  isJumping = false
  popoFrame = 0
  currentFrameTime = 0
  yVelocity = 0
  if (popoElem) {
    // popoElem이 null이 아닐 때만 setCustomProperty 호출
    setCustomProperty(popoElem, "--bottom", 0);
  }
  // ['keydown', 'click'].forEach(event => {
    modal.removeEventListener("click", onJump);
    modal.addEventListener("click", onJump);   
    document.removeEventListener("keydown", onJump);
    document.addEventListener("keydown", onJump);

  // });
}

export function updatePopo(delta, speedScale, popoElem) {
  handleRun(delta, speedScale, popoElem)
  handleJump(delta, popoElem)
}

export function getPopoRect(popoElem) {
  return popoElem.getBoundingClientRect()
}

export function setPopoLose(popoElem) {
  popoElem.src = "imgs/popo-lose.png"
}

function handleRun(delta, speedScale, popoElem) {
  if (isJumping) {
    popoElem.src = `imgs/popo-stationary.png`
    return
  }

  if (currentFrameTime >= FRAME_TIME) {
    popoFrame = (popoFrame + 1) % POPO_FRAME_COUNT
    popoElem.src = `imgs/popo-run-${popoFrame}.png`
    currentFrameTime -= FRAME_TIME
  }
  currentFrameTime += delta * speedScale
}

function handleJump(delta, popoElem) {
  if (!isJumping) return

  incrementCustomProperty(popoElem, "--bottom", yVelocity * delta)

  if (getCustomProperty(popoElem, "--bottom") <= 0) {
    setCustomProperty(popoElem, "--bottom", 0)
    isJumping = false
  }

  yVelocity -= GRAVITY * delta
}

function onJump(e) {
  if ((e.type === "click" || e.code === "Space") && !isJumping){
    yVelocity = JUMP_SPEED
    isJumping = true
  }

}
