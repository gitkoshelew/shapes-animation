const header = document.getElementById('header')
const dashboard = document.getElementById('dashboard')
const canvas = document.getElementById('canvas')
const resetButton = document.getElementById('dashboard__buttons-start')
const aboutOpenButton = document.getElementById('dashboard__buttons-about')

const about = document.getElementById('description')
const aboutModal = document.getElementById('description__modal')
const aboutCloseButton = document.getElementById('description__modal-close')
const Pi = 3.14

const makeSVG = (tag, attrs) => {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  setAttrs(el, attrs)
  return el;
}

const setAttrs = (el, attrs) => {
  for (var k in attrs)
    el.setAttribute(k, attrs[k]);
}

const setStyles = (el, styles) => {
  for (var k in styles)
    el.style[k] = styles[k];
}

const calculateCanvasXY = () => {
  const { innerWidth, innerHeight } = window;
  const height = innerHeight - header.clientHeight - dashboard.clientHeight
  return [innerWidth, height]
}

class Shapes {

  _dots = []

  constructor(selector, width, height) {
    this._main = document.querySelector(selector);
    this._canvas = Canvas.create({
      parent: this._main,
      width,
      height
    })

    this._run();
  }

  _run() {
    let dotsCounter = 0
    const handler = (event) => {
      dotsCounter++
      if (dotsCounter <= 3)
      {
        const { offsetX, offsetY } = event
        const dotOptions = {
          coords: [offsetX, offsetY],
          size: 11,
          attributes: { fill: 'red' },
          textAttributes: { x: 11, y: 11 },
          textStyle: { fill: '#770000', fontFamily: 'Arial', fontSize: 11, pointerEvents: 'none' }
        }
        this._addDot(dotOptions);
      }
      if (dotsCounter === 3)
      {
        this._canvas.elem.removeEventListener('click', handler)
        this._canvas.elem.addEventListener('repaint', () => window.requestAnimationFrame(this._redraw))
        this._dots.forEach(dot => dot.initHandlers())

        this._drawParallelogram(this._dots.map(dot => {
          return dot.coords
        }))

        const dotOptions = {
          coords: this.parallelogram.coords[3],
          size: 11,
          attributes: { fill: 'black' },
          prepend: true,
          textAttributes: { x: 11, y: 11 },
          textStyle: { color: 'black', fontFamily: 'Arial', fontSize: 11, pointerEvents: 'none' }
        }
        this._addDot(dotOptions)
        this._drawCircleAccordingParallelogram(this.parallelogram)
      }

    }
    this._canvas.elem.addEventListener('click', handler);
    window.addEventListener('resize', this._resize)
  }

  _resize = () => window.requestAnimationFrame(
    () => {
      const [_width, _height] = this._canvas.size
      const [width, height] = calculateCanvasXY();
      this._dots.forEach(dot => {
        const [x, y] = dot.coords;
        dot.redraw([(width / _width) * x, (height / _height) * y])
      })
      this._canvas.size = [width, height]
      this._redraw()
    }
  )

  _addDot(options) {
    const dot = Dot.create({ parent: this._canvas.elem, ...options })
    this._dots.push(dot)
  }

  _drawParallelogram(partCoords) {
    this.parallelogram = new Parallelogram({ parent: this._canvas.elem, partCoords, attributes: { stroke: 'blue' }, styles: { pointerEvents: 'none' } })
  }

  _drawCircleAccordingParallelogram(parallelogram) {
    if (!parallelogram) throw Error('parallelogram not defined')
    const { square, center } = parallelogram

    const circleOptions = {
      parent: this._canvas.elem,
      coords: center,
      size: Round.calculateDiameterFromSquare(square),
      attributes: { fill: 'none', stroke: 'yellow', strokeWidth: 2 },
      styles: { pointerEvents: 'none' },
      prepend: true,
      textAttributes: { x: 11, y: 11 },
      textStyle: { fill: '#ffff00', fontFamily: 'Arial', fontWeight: 'bold', fontSize: 13, pointerEvents: 'none' }
    }
    this.circle = Circle.create(circleOptions)
  }

  _redraw = () => {
    const [c1, c2, c3] = this._dots.map(dot => dot.coords)
    this.parallelogram.redraw([c1, c2, c3])
    this._dots[3].redraw(this.parallelogram.coords[3])
    this.circle.redraw(this.parallelogram.center, Round.calculateDiameterFromSquare(this.parallelogram.square))
  }


  _destroy = () => {
    this._dots.forEach(dot => { dot.destroy() })
    this.parallelogram && this.parallelogram.destroy()
    this.circle && this.circle.destroy()

    this._dots = []
    this.parallelogram = null
    this.circle = null
  }

  reset = () => {
    this._destroy()
    this._run()
  }
}


class Round {

  constructor({ parent, coords, size, attributes = {}, styles = {}, prepend, textAttributes = {}, textStyle = { fontSize: 16 } }) {

    this._coords = coords
    this._size = size;
    this._parent = parent;
    this._attributes = attributes;
    this._styles = styles;
    this._prepend = prepend;
    this._textAttributes = textAttributes;
    this._textStyle = textStyle
    this._elem = null;

    this._init();
  }

  static calculateDiameterFromSquare(square) {
    return Math.sqrt(square / Pi) * 2
  }

  _init() {
    this._draw()
    this._append()
    this._drawText()
  }

  _setCoords(coords) {
    this._coords = coords;
  }

  _setSize(size) {
    this._size = size;
  }

  _append() {
    if (this._prepend)
    {
      this._parent.prepend(this._elem)
    } else
    {
      this._parent.append(this._elem)
    }
  }

  highlight(colorAttrs) {
    const circle = this._elem.querySelector('circle')
    setAttrs(circle, colorAttrs)
  }

  _createText() {
    const [x, y] = this._coords
    return `[${x}; ${y}]`
  }

  _drawText() {
    const text = this._createText()
    const textElem = makeSVG('text', this._textAttributes)
    textElem.innerHTML = text;
    setStyles(textElem, this._textStyle)
    this._textElem = textElem;

    this._elem.appendChild(textElem)
    const fullWidth = this._size + this._textElem.textLength.baseVal.value
    setAttrs(this._elem, { 'viewBox': `0 0 ${fullWidth} ${this._textStyle.fontSize + 2}`, width: fullWidth, height: this._textStyle.fontSize + 2 })
  }

  _redrawText() {
    const text = this._createText()
    const textElem = this._elem.querySelector('text')
    textElem.innerHTML = text;
    const fullWidth = this._size + this._textElem.textLength.baseVal.value
    setAttrs(this._elem, { 'viewBox': `0 0 ${fullWidth} ${this._textStyle.fontSize + 2}`, width: fullWidth, height: this._textStyle.fontSize + 2 })
  }

  _draw() {
    const svg = makeSVG('svg', {
      height: this._size,
      width: this._size,
      viewBox: `0 0 ${this._size} ${this._size}`
    });

    const [x, y] = this._coords
    const centerGap = ((this._size % 2 ? this._size : this._size - 1) / 2)
    const radius = this._size / 2;
    const innerRadius = radius - (this._attributes?.strokeWidth || 0)

    setStyles(svg, { ...this._styles, left: x - centerGap, top: y - centerGap })

    const circle = makeSVG('circle', { ...this._attributes, cx: radius, cy: radius, r: innerRadius })

    svg.appendChild(circle)

    this._elem = svg
  }

  _calculateNodePosition() {
    setAttrs(this._elem, {
      height: this._size,
      width: this._size,
      viewBox: `0 0 ${this._size} ${this._size}`
    })

    const [x, y] = this._coords
    const centerGap = ((this._size % 2 ? this._size : this._size - 1) / 2)
    const radius = this._size / 2;
    const innerRadius = radius - (this._attributes?.strokeWidth || 0)

    this._elem.style.left = x - centerGap
    this._elem.style.top = y - centerGap

    const circle = this._elem.querySelector('circle')

    setAttrs(circle, { cx: radius, cy: radius, r: innerRadius })
  }

  redraw(coords, size) {
    if (size)
    {
      this._setSize(size)
    }
    this._setCoords(coords)
    this._calculateNodePosition()
    this._redrawText()
  }

  destroy() {
    this._elem.remove()
  }
}

class Dot extends Round {

  constructor(...args) {
    super(...args)
    this.dragstart = false
  }

  static create(options) {
    return new Dot(options);
  }

  get coords() {
    return this._coords;
  }

  /**
   * @param {[number, number]} value
   */
  set coords(value) {
    this._coords = value;
  }

  initHandlers() {
    this._elem.addEventListener('mousedown', this._mouseDown);
    this._elem.addEventListener('mousemove', this._mouseMove);
    this._parent.addEventListener('mouseup', this._mouseUp, false);
    this._parent.addEventListener('mousemove', this._mousemoveParent, false);
  }

  removeHandlers() {
    this._parent.removeEventListener('mouseup', this._mouseUp);
    this._parent.removeEventListener('mousemove', this._mousemoveParent);
  }

  _createText() {
    const [x, y] = this._coords
    return `x: ${Math.round(x)}; y: ${Math.round(y)}`
  }

  _move([newX, newY]) {
    const halfSize = this._size / 2
    this._elem.style.left = newX - halfSize;
    this._elem.style.top = newY - halfSize;
    this._setCoords([newX, newY])
    this._redrawText()
    this._elem.dispatchEvent(new Event('repaint', { bubbles: true }))
  }

  _mouseUp = () => {
    this.dragstart = false;
    this.highlight({ fill: this._attributes.fill || 'none' })
  }

  _mouseDown = () => {
    this.dragstart = true;
    this.highlight({ fill: 'rgb(199 90 90)' })
  }

  _mouseMove = (event) => {
    if (!this.dragstart) return;
    const { offsetX, offsetY } = event
    const [x, y] = this._coords;

    const newX = x + offsetX - this._size / 2
    const newY = y + offsetY - this._size / 2

    this._move([newX, newY])
  }

  _mousemoveParent = (event) => {
    if (!this.dragstart || event.target !== this._parent) return;
    const { offsetX, offsetY } = event
    this._move([offsetX, offsetY])
  }

  _drawText() {
    super._drawText()
    this._updateTextPosition()
  }

  _redrawText() {
    super._redrawText()
    this._updateTextPosition()
  }

  _updateTextPosition() {
    const width = this._elem.getAttribute('width')
    const textwidth = this._textElem.textLength.baseVal.value

    if (this._size + textwidth > Number(width))
    {
      setAttrs(this._elem, { 'viewBox': `0 0 ${this._size + textwidth} ${this._textStyle.fontSize + 2}`, width: this._size + textwidth, height: this._textStyle.fontSize + 2 })
    }
  }

  destroy() {
    this.removeHandlers()
    super.destroy()
  }
}

class Circle extends Round {

  static create(options) {
    return new Circle(options);
  }

  _drawText() {
    super._drawText()
    this._updateTextPosition()
  }

  _redrawText() {
    super._redrawText()
    this._updateTextPosition()
  }

  _updateTextPosition() {
    const xGap = this._size - this._textElem.textLength.baseVal.value
    const yGap = this._size - this._textStyle.fontSize

    const xText = xGap > 0 ? xGap / 2 : 0
    const yText = yGap > 0 ? yGap / 2 + this._textStyle.fontSize : this._size

    setAttrs(this._textElem, { x: xText, y: yText })
    const x1 = xGap > 0 ? this._size : this._size - xGap
    const y1 = yGap > 0 ? this._size : this._size - yGap

    setAttrs(this._elem, { 'viewBox': `0 0 ${x1} ${y1}`, width: x1, height: y1 })
  }

  _createText() {
    const [x, y] = this._coords
    const square = this._calculateSquare(this._size)
    return `x: ${Math.round(x)}; y: ${Math.round(y)}, square: ${Math.round(square)}`
  }

  _calculateSquare() {
    return Pi * (this._size ** 2)
  }
}


class Parallelogram {

  _coords = []
  _width = 0
  _height = 0
  _square = 0
  _startCoords = [0, 0]
  _center = [0, 0]

  constructor({ parent, partCoords, attributes, styles = {} }) {
    this._parent = parent;
    this._partCoords = partCoords;
    this._attributes = attributes;
    this._styles = styles;

    this._init()
  }

  _init() {
    this._calculateGeometry()
    this._draw();
  }

  _setPartCoords(partCoords) {
    this._partCoords = partCoords
  }

  _setCoords(coords) {
    this._coords = coords;
  }

  _setCenter(center) {
    this._center = center;
  }

  _findFouthCoord() {
    const [[dot0x, dot0y], [dot1x, dot1y], [dot2x, dot2y]] = this._partCoords
    const centerX = (dot0x + dot2x) / 2
    const centerY = (dot0y + dot2y) / 2
    const dot3x = 2 * centerX - dot1x
    const dot3y = 2 * centerY - dot1y
    this._setCoords([...this._partCoords, [dot3x, dot3y]])
    this._setCenter([centerX, centerY])
  }

  _findSpace() {
    const xArraySort = this._coords.map(([x]) => x).sort((a, b) => a - b)
    const yArraySort = this._coords.map(([, y]) => y).sort((a, b) => a - b)
    this._width = xArraySort[3] - xArraySort[0]
    this._height = yArraySort[3] - yArraySort[0]
    this._startCoords = [xArraySort[0], yArraySort[0]]
  }

  get center() {
    return this._center;
  }

  get coords() {
    return this._coords;
  }

  get square() {
    return this._square;
  }

  _calculateSquare() {
    const linesLengths = []
    this._partCoords.forEach(([x1, y1], index, array) => {
      const [x2, y2] = index === array.length - 1 ? array[0] : array[index + 1]
      const length = Math.sqrt(Math.abs(x2 - x1) ** 2 + Math.abs(y2 - y1) ** 2)
      linesLengths.push(length)
    })
    const halfPerimeter = linesLengths.reduce((sum, length) => sum + length, 0) / 2
    const SQ = linesLengths.reduce((acc, side) => acc * (halfPerimeter - side), halfPerimeter)
    this._square = 2 * Math.sqrt(SQ)
  }

  _draw() {
    const [left, top] = this._startCoords;

    const svg = makeSVG('svg', {
      height: this._height,
      width: this._width
    });

    setStyles(svg, { ...this._styles, top, left })

    this._coords.forEach(([x1, y1], index, array) => {
      const [x2, y2] = index === array.length - 1 ? array[0] : array[index + 1]

      const line = makeSVG('line', {
        ...this._attributes, x1: x1 - left, y1: y1 - top, x2: x2 - left, y2: y2 - top
      });
      svg.appendChild(line)
    })

    this._parent.prepend(svg)
    this._elem = svg;
  }

  _updatePosition() {
    const [left, top] = this._startCoords;
    const lines = this._elem.querySelectorAll('line')

    setStyles(this._elem, { top, left })
    setAttrs(this._elem, {
      height: this._height,
      width: this._width
    })

    this._coords.forEach(([x1, y1], index, array) => {
      const [x2, y2] = index === array.length - 1 ? array[0] : array[index + 1]
      setAttrs(lines[index], {
        x1: x1 - left, y1: y1 - top, x2: x2 - left, y2: y2 - top
      })
    })
  }

  _calculateGeometry() {
    this._findFouthCoord()
    this._calculateSquare()
    this._findSpace()
  }

  redraw(partCoords) {
    this._setPartCoords(partCoords)
    this._calculateGeometry()
    this._updatePosition()
  }

  destroy() {
    this._elem.remove()
  }
}

class Canvas {

  constructor({ parent, width, height }) {
    this._parent = parent
    this._width = width
    this._height = height
    this._elem = document.createElement('div');

    this._init()
  }

  static create(options) {
    return new Canvas(options);
  }

  _init() {
    const { _parent, _elem, _width, _height } = this
    setStyles(_elem, { width: `${_width}px`, height: `${_height}px`, overflow: 'hidden' })
    _parent.appendChild(_elem);
  }

  _redraw(width, height) {
    setStyles(this._elem, { width: `${width}px`, height: `${height}px` })
  }

  set size([width, height]) {
    this._width = width;
    this._height = height
    this._redraw(width, height)
  }

  get size() {
    return [this._width, this._height]
  }

  get elem() {
    return this._elem
  }

  destroy() {
    this._elem.remove()
  }
}


const shapes = new Shapes('#shapes', ...calculateCanvasXY());
resetButton.addEventListener('click', shapes.reset)
const onOpenAbout = () => about.classList.remove('description_closed')
const onCloseAbout = () => about.classList.add('description_closed')

aboutOpenButton.addEventListener('click', onOpenAbout)
about.addEventListener('click', onCloseAbout)
aboutModal.addEventListener('click', (e) => e.stopPropagation())
aboutCloseButton.addEventListener('click', onCloseAbout)

