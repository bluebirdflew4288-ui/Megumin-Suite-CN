export const KAZUMA_PLACEHOLDERS = [
        { key: '"%prompt%"', desc: "正面提示词（文本）" },
        { key: '"%negative_prompt%"', desc: "负面提示词（文本）" },
        { key: '"%seed%"', desc: "种子（整数）" },
        { key: '"%steps%"', desc: "采样步数（整数）" },
        { key: '"%scale%"', desc: "CFG 比例（浮点数）" },
        { key: '"%denoise%"', desc: "去噪强度（浮点数）" },
        { key: '"%clip_skip%"', desc: "CLIP 跳过（整数）" },
        { key: '"%model%"', desc: "检查点名称" },
        { key: '"%sampler%"', desc: "采样器名称" },
        { key: '"%width%"', desc: "图像宽度（px）" },
        { key: '"%height%"', desc: "图像高度（px）" },
        { key: '"%lora1%"', desc: "LoRA 1 文件名" },
        { key: '"%lorawt1%"', desc: "LoRA 1 权重（浮点数）" },
        { key: '"%lora2%"', desc: "LoRA 2 文件名" },
        { key: '"%lorawt2%"', desc: "LoRA 2 权重（浮点数）" },
        { key: '"%lora3%"', desc: "LoRA 3 文件名" },
        { key: '"%lorawt3%"', desc: "LoRA 3 权重（浮点数）" },
        { key: '"%lora4%"', desc: "LoRA 4 文件名" },
        { key: '"%lorawt4%"', desc: "LoRA 4 权重（浮点数）" }
    ];
    
export const RESOLUTIONS =[
        { label: "1024 x 1024（SDXL 1:1）", w: 1024, h: 1024 },
        { label: "1152 x 896（SDXL 横版）", w: 1152, h: 896 },
        { label: "896 x 1152（SDXL 竖版）", w: 896, h: 1152 },
        { label: "1216 x 832（SDXL 横版）", w: 1216, h: 832 },
        { label: "832 x 1216（SDXL 竖版）", w: 832, h: 1216 },
        { label: "1344 x 768（SDXL 横版）", w: 1344, h: 768 },
        { label: "768 x 1344（SDXL 竖版）", w: 768, h: 1344 },
        { label: "512 x 512（SD 1.5 1:1）", w: 512, h: 512 },
        { label: "768 x 512（SD 1.5 横版）", w: 768, h: 512 },
        { label: "512 x 768（SD 1.5 竖版）", w: 512, h: 768 },
    ];