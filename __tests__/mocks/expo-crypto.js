module.exports = {
    getRandomBytes: jest.fn((size) => new Uint8Array(size).fill(0xab)),
    getRandomBytesAsync: jest.fn((size) => Promise.resolve(new Uint8Array(size).fill(0xab))),
};
