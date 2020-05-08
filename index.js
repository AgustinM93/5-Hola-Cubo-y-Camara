import { getCanvasElement, getWebGL2Context, createShader, createProgram, createVertexBuffer, bindAttributeToVertexBuffer, createIndexBuffer, magic } from "./utils/gl-utils.js"
import { vertexShaderSourceCode, fragmentShaderSourceCode } from "./utils/shaders.js"
import { mat4, glMatrix } from './utils/gl-matrix/index.js'

// #️⃣ Configuración base de WebGL

const canvas = getCanvasElement('canvas')
const gl = getWebGL2Context(canvas)

gl.clearColor(0, 0, 0, 1)
gl.enable(gl.DEPTH_TEST)

// #️⃣ Creamos los shaders, el programa que vamos a usar, y guardamos info de sus inputs (atributos y uniforms)

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSourceCode)
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceCode)
const program = createProgram(gl, vertexShader, fragmentShader)

const vertexPositionLocation = gl.getAttribLocation(program, 'vertexPosition')
const vertexColorLocation = gl.getAttribLocation(program, 'vertexColor')
const modelMatrixLocation = gl.getUniformLocation(program, 'modelMatrix')
const viewMatrixLocation = gl.getUniformLocation(program, "viewMatrix")
const projectionMatrixLocation = gl.getUniformLocation(program, "projectionMatrix")

// #️⃣ Definimos la info de la geometría que vamos a dibujar

const vertexPositions = [
  -1, 1, 1,
  1, 1, 1,
  1, 1, -1,
  -1, 1, -1,
  -1, -1, 1,
  1, -1, 1,
  1, -1, -1,
  -1, -1, -1
]

const vertexColors = [
  1, 0, 1,
  1, 1, 1,
  0, 1, 1,
  0, 0, 1,
  1, 0, 0,
  1, 1, 0,
  0, 1, 0,
  0, 0, 0
]

const indices = [
  0, 1, 3, 3, 1, 2,
  7, 5, 4, 5, 7, 6,
  3, 4, 0, 3, 7, 4,
  5, 2, 1, 5, 6, 2,
  4, 1, 0, 4, 5, 1,
  6, 3, 2, 6, 7, 3,
]

// #️⃣ Guardamos la info de la geometría en VBOs e IBO

const vertexPositionsBuffer = createVertexBuffer(gl, vertexPositions)
const vertexColorsBuffer = createVertexBuffer(gl, vertexColors)
const indexBuffer = createIndexBuffer(gl, indices)

// #️⃣ Asociamos los atributos del programa a los buffers creados, y establecemos el buffer de indices a usar

const vertexArray = gl.createVertexArray()
gl.bindVertexArray(vertexArray)
gl.enableVertexAttribArray(vertexPositionLocation)
bindAttributeToVertexBuffer(gl, vertexPositionLocation, 3, vertexPositionsBuffer)
gl.enableVertexAttribArray(vertexColorLocation)
bindAttributeToVertexBuffer(gl, vertexColorLocation, 3, vertexColorsBuffer)
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
gl.bindVertexArray(null)

// #️⃣ Creamos las matrices relacionadas a nuestra geometría/modelo y las inicializamos

const translationMatrix = mat4.create()
const scaleMatrix = mat4.create()
const rotationMatrix = mat4.create()
const modelMatrix = mat4.create()

let translation = 0
let scale = 1
let rotation = 0

mat4.fromTranslation(translationMatrix, [translation, 0, 0])
mat4.fromScaling(scaleMatrix, [scale, scale, 1])
mat4.fromRotation(rotationMatrix, glMatrix.toRadian(rotation), [0, 0, 1])

mat4.multiply(modelMatrix, scaleMatrix, modelMatrix)
mat4.multiply(modelMatrix, rotationMatrix, modelMatrix)
mat4.multiply(modelMatrix, translationMatrix, modelMatrix)

// #️⃣ Creamos las matrices relacionadas a la cámara y las inicializamos

const viewMatrix = mat4.create()
const projectionMatrix = mat4.create()

const eye = [0, 0, 0]
const center = [0, 0, 0]
const up = [0, 1, 0]
mat4.lookAt(viewMatrix, eye, center, up)

const fov = glMatrix.toRadian(45)
const aspect = canvas.width / canvas.height

let near = 0.1
let far = 10
mat4.perspective(projectionMatrix, fov, aspect, near, far)

// #️⃣ Establecemos el programa a usar, sus conexiónes atributo-buffer e indices a usar (guardado en el VAO)

gl.useProgram(program)
gl.bindVertexArray(vertexArray)

// #️⃣ Pasamos los valores de las matrices a los uniforms del shader de vertices

gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix)
gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix)
gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)

/* 📝
 * Estar siempre atentos a que el seteo de uniforms se realize teniendo un programa en uso (via
 * gl.useProgram). En este caso, dado que todas las matrices se inicializan y se mantienen
 * constantes (no hay cambios en la posición de modelo, ni movimientos en la cámara, etc) estamos
 * pudiendo optimizar el código que se ejecuta en la función render, extrayendo el seteo de
 * uniforms, y evitando volver a pasar valores que no cambian.
 */

// #️⃣ Dibujamos la escena

function render(currentTime) {
  // Limpiamos el canvas y dibujamos
  mat4.lookAt(viewMatrix, eye, center, up)
  gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix)
  mat4.perspective(projectionMatrix, fov, aspect, near, far)
  
  gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix)
  gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)

  // Solicitamos el proximo frame
  requestAnimationFrame(render)
}

// Nuestro primer frame
requestAnimationFrame(render)


window.addEventListener("keydown", event =>{ 
    if(event.keyCode == 87){//W
      eye[2]=eye[2]+0.1
    }
  } )

  window.addEventListener("keydown", event =>{ 
    if(event.keyCode == 83){//S
      eye[2]=eye[2]-0.1  
    }
  } )

  window.addEventListener("keydown", event =>{ 
    if(event.keyCode == 68){//D
      eye[0]=eye[0]+0.1  
    }
  } )

  window.addEventListener("keydown", event =>{ 
    if(event.keyCode == 65){//A
      eye[0]=eye[0]-0.1  
    }
  } )


  window.addEventListener("keydown", event =>{ 
    if(event.keyCode == 38){//UP
      center[1]=center[1]+0.1  
    }
  } )

  window.addEventListener("keydown", event =>{ 
    if(event.keyCode == 40){//DOWN
      center[1]=center[1]-0.1  
    }
  } )

  window.addEventListener("keydown", event =>{ 
    if(event.keyCode == 90){//Z
      near=near-0.1 
    
    }
  } )

  window.addEventListener("keydown", event =>{ 
    if(event.keyCode == 88){//X
      near=near+0.1  
      
    }
  } )

  window.addEventListener("keydown", event =>{ 
    if(event.keyCode == 78){//N
      far=far-0.1 
    
    }
  } )

  window.addEventListener("keydown", event =>{ 
    if(event.keyCode == 77){//M
      far=far+0.1 
    
    }
  } )