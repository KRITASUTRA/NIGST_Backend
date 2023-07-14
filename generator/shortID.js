const shortid= require('shortid')


const generateShortId = (numOfChars) => {
    return shortid.generate().slice(0, numOfChars)
  }




  module.exports=generateShortId