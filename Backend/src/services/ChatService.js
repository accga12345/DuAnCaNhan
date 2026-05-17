const { NlpManager } = require('node-nlp');
const manager = new NlpManager({ languages: ['vi'], forceNER: true });

const initNLP = async () => {
    manager.addRegexEntity('budget', 'vi', /(\d+)\s*(triệu|tr|củ|m)/i);

    manager.addDocument('vi', 'Xin chào', 'greeting');
    manager.addDocument('vi', 'Hi shop', 'greeting');
    manager.addDocument('vi', 'Chào bạn', 'greeting');
    manager.addAnswer('vi', 'greeting', 'Chào bạn! Mình là Bot hỗ trợ. Mình giúp gì được cho bạn?');

    manager.addDocument('vi', 'tư vấn build pc', 'build.pc');
    manager.addDocument('vi', 'mình muốn ráp máy tính', 'build.pc');
    manager.addDocument('vi', 'cần build máy khoảng %budget%', 'build.pc');
    manager.addDocument('vi', 'ráp pc %budget%', 'build.pc');
    manager.addDocument('vi', 'tư vấn %budget% mua pc', 'build.pc');

    manager.addAnswer('vi', 'None', 'Dạ, hiện tại mình chỉ hỗ trợ tư vấn ráp PC thôi ạ. Bạn cần ráp máy khoảng bao nhiêu tiền?');

    await manager.train();
    manager.save();
    console.log("✅ Local NLP đã sẵn sàng (Dự phòng cho Groq)");
};

initNLP();

const processLocalNLP = async (message) => {
    return await manager.process('vi', message);
};

module.exports = { processLocalNLP };
