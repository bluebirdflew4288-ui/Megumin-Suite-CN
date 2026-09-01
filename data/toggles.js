// Global on/off behaviour toggles.
// Moved verbatim out of database.js. Content unchanged.

export const toggles = {
    ooc: { label: "OOC 评述", trigger: "[[OOC]]", content: "OOC: you have the ability to talk to the user directly to comment on the story. the line should be between[]." },
    control: { label: "阻止 AI 控制用户", trigger: "[[control]]", recommendedOff: true, content: "Never write dialogue, actions, or decisions for {{user}}. You control the world. The user controls themselves." }
};
