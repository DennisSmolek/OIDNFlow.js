type WebGLState = {
    program: WebGLProgram,
    activeTexture: number,
    arrayBuffer: WebGLBuffer,
    elementArrayBuffer: WebGLBuffer,
    framebuffer: WebGLFramebuffer,
    renderbuffer: WebGLRenderbuffer,
    texture: WebGLTexture,
    viewport: number[],
    blend: boolean,
    depthTest: boolean,
    cullFace: boolean,
    scissorTest: boolean,
    scissor: number[],
    blendFunc: number[],
    blendEquation: number[],
    colorMask: boolean[],
    clearColor: number[],
    pixelStoreParams: {
        unpackAlignment: number,
        unpackFlipY: boolean,
        unpackPremultiplyAlpha: boolean,
        unpackColorspaceConversion: number
    }
}

export class WebGLStateManager {
    private gl: WebGLRenderingContext;
    private tfState: WebGLState | null = null;
    private capturedState: WebGLState | null = null;
    public ingoreRestore = false;
    public debugging = false;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
    }

    private captureState(): WebGLState {
        const gl = this.gl;
        return {
            program: gl.getParameter(gl.CURRENT_PROGRAM),
            activeTexture: gl.getParameter(gl.ACTIVE_TEXTURE),
            arrayBuffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING),
            elementArrayBuffer: gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING),
            framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING),
            renderbuffer: gl.getParameter(gl.RENDERBUFFER_BINDING),
            texture: gl.getParameter(gl.TEXTURE_BINDING_2D),
            viewport: gl.getParameter(gl.VIEWPORT),
            blend: gl.isEnabled(gl.BLEND),
            depthTest: gl.isEnabled(gl.DEPTH_TEST),
            cullFace: gl.isEnabled(gl.CULL_FACE),
            scissorTest: gl.isEnabled(gl.SCISSOR_TEST),
            scissor: gl.getParameter(gl.SCISSOR_BOX),
            blendFunc: [
                gl.getParameter(gl.BLEND_SRC_RGB),
                gl.getParameter(gl.BLEND_DST_RGB),
                gl.getParameter(gl.BLEND_SRC_ALPHA),
                gl.getParameter(gl.BLEND_DST_ALPHA)
            ],
            blendEquation: [
                gl.getParameter(gl.BLEND_EQUATION_RGB),
                gl.getParameter(gl.BLEND_EQUATION_ALPHA)
            ],
            colorMask: gl.getParameter(gl.COLOR_WRITEMASK),
            clearColor: gl.getParameter(gl.COLOR_CLEAR_VALUE),
            pixelStoreParams: {
                unpackAlignment: gl.getParameter(gl.UNPACK_ALIGNMENT),
                unpackFlipY: gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL),
                unpackPremultiplyAlpha: gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL),
                unpackColorspaceConversion: gl.getParameter(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL)
            }
        };
    }

    captureCurrentState() {
        this.capturedState = this.captureState();
        this.logState(this.capturedState, 'Captured Current State NO TF');
    }

    saveState(ignoreRestore = this.ingoreRestore) {
        this.tfState = this.captureState();
        this.logState(this.tfState, 'Saved TF State');
        if (!ignoreRestore && this.capturedState) {
            this.applyState(this.capturedState);
            this.logState(this.capturedState, 'Restored Original State');
        }
    }

    restoreState() {
        if (!this.tfState) return;

        this.capturedState = this.captureState();
        this.logState(this.capturedState, 'Captured Original State');
        this.applyState(this.tfState);
        this.logState(this.tfState, 'Restored TF State');
    }

    private applyState(state: WebGLState) {
        const gl = this.gl;

        gl.useProgram(state.program);
        gl.activeTexture(state.activeTexture);
        gl.bindBuffer(gl.ARRAY_BUFFER, state.arrayBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.elementArrayBuffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, state.framebuffer);
        gl.bindRenderbuffer(gl.RENDERBUFFER, state.renderbuffer);
        gl.bindTexture(gl.TEXTURE_2D, state.texture);
        gl.viewport(state.viewport[0], state.viewport[1], state.viewport[2], state.viewport[3]);
        gl.scissor(state.scissor[0], state.scissor[1], state.scissor[2], state.scissor[3]);

        state.blend ? gl.enable(gl.BLEND) : gl.disable(gl.BLEND);
        state.depthTest ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST);
        state.cullFace ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
        state.scissorTest ? gl.enable(gl.SCISSOR_TEST) : gl.disable(gl.SCISSOR_TEST);

        gl.blendFuncSeparate(state.blendFunc[0], state.blendFunc[1], state.blendFunc[2], state.blendFunc[3]);
        gl.blendEquationSeparate(state.blendEquation[0], state.blendEquation[1]);
        gl.colorMask(state.colorMask[0], state.colorMask[1], state.colorMask[2], state.colorMask[3]);
        gl.clearColor(state.clearColor[0], state.clearColor[1], state.clearColor[2], state.clearColor[3]);

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, state.pixelStoreParams.unpackAlignment);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, state.pixelStoreParams.unpackFlipY);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, state.pixelStoreParams.unpackPremultiplyAlpha);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, state.pixelStoreParams.unpackColorspaceConversion);
    }

    logState(state: WebGLState, addedContext = '') {
        if (!this.debugging) return;
        console.log(`WebGL State:${addedContext}`);
        console.table(state);
    }
}