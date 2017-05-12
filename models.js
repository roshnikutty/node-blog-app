const mongoose = require('mongoose');


const blogSchema = mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: {
        firstName: String,
        lastName: String
    }
});


blogSchema.virtual('authorString').get(function () {
    return `${this.author.firstName} ${this.author.lastName}`.trim()
});


blogSchema.methods.apiRepr = function () {

    return {
        id: this._id,
        title: this.title,
        content: this.content,
        author: this.authorString
    };
}

const Blog = mongoose.model('Blog', blogSchema);

module.exports = { Blog };
