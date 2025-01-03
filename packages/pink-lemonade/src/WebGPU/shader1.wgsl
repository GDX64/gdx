struct OurVertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
};

struct OurStruct {
    color: vec4f,
    scale: vec2f,
    offset: vec2f,
};

@group(0) @binding(0) var<uniform> ourStruct: OurStruct;

@vertex
fn vs(
    @builtin(vertex_index) vertexIndex: u32
) -> OurVertexShaderOutput {
    let pos = array(
        vec2f(0.0, 0.5),  // top center
        vec2f(-0.5, -0.5),  // bottom left
        vec2f(0.5, -0.5)   // bottom right
    );

    let color = array<vec4f, 3>(
        vec4f(1, 0, 0, 1), // red
        vec4f(0, 1, 0, 1), // green
        vec4f(0, 0, 1, 1), // blue
    );

    let selected = pos[vertexIndex];
    let pos_v = vec4f(selected * ourStruct.scale + ourStruct.offset, 0.0, 1.0);

    var vsOutput: OurVertexShaderOutput;
    vsOutput.position = pos_v
    vsOutput.color = color[vertexIndex];
    return vsOutput;
}  
 
@fragment 
fn fs(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
    let red = vec4f(1, 0, 0, 1);
    let cyan = vec4f(0, 1, 1, 1);

    let sum = u32(fsInput.position.x + fsInput.position.y);
    let num = sum / 8;
    let checker = num % 2 == 1;
    return select(red, cyan, checker);
}