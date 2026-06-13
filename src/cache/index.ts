const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 72000 }); // ou outro TTL conforme necessário

export default cache;
