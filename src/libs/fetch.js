
module.exports = {
  getSetList:   async () => { throw new Error('getSetList not connected') },
  getSetCards:  async (setCode) => { throw new Error('getSetCards not connected') },
  getSetImage:  async (setCode) => { throw new Error('getSetImage not connected') },
  getCardImage: async (cardData) => { throw new Error('getCardImage not connected') },
}