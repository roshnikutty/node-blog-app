const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {Blog} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogData(){
    const seedData = [];
    for (let i = 1; i<0; i++){
        seedData.push(generateBlogData());
    }
    return Blog.insertMany(seedData);
}

function tearDownDb() {
    console.log('Deleting database');
    return mongoose.connection.dropDatabase();
}

function generateBlogData(){
    return {
        title:faker.Lorem.words(),
        content:faker.Lorem.sentence(),
        author:{
            firstName:faker.Name.firstName(),
            lastName:faker.Name.lastName()
        }
    };
}

describe('Blogs API resource', function() {

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  })


  describe('GET endpoint', function() {

    it('should return all existing blogs', function() {
      
      let res;
      return chai.request(app)
        .get('/blogs')
        .then(function(_res) {
          res = _res;
          res.should.have.status(200);
          res.body.blogs.should.have.length.of.at.least(1);
          return Blog.count();
        })
        .then(function(count) {
          res.body.blogs.should.have.length.of(count);
        });
    });


    it('should return blogs with right fields', function() {
      // Strategy: Get back all blogs, and ensure they have expected keys

      let resBlog;
      return chai.request(app)
        .get('/blogs')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.blogs.should.be.a('array');
          res.body.blogs.should.have.length.of.at.least(1);

          res.body.blogs.forEach(function(blog) {
            blog.should.be.a('object');
            blog.should.include.keys(
              'title', 'content', 'author', 'publishDate');
          });
          resBlog = res.body.blogs[0];
          return Blog.findById(resBlog.id);
        })
        .then(function(blog) {
          resBlog.id.should.equal(blog.id);
          resBlog.title.should.equal(blog.title);
          resBlog.content.should.equal(blog.content);
          resBlog.author.should.equal(blog.author);
          resBlog.publishDate.should.contain(blog.publishDate);
        });
    });
  });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the blog we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new blog', function() {

      const newBlog = generateBlogData();

      return chai.request(app)
        .post('/blogs')
        .send(newBlog)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id', 'title', 'content', 'author');
          res.body.title.should.equal(newBlog.title);
          res.body.id.should.not.be.null;
          res.body.content.should.equal(newBlog.content);
          res.body.author.should.equal(newBlog.author);
    
          return Blog.findById(res.body.id);
        })
        .then(function(blog) {
          blog.title.should.equal(newBlog.title);
          blog.content.should.equal(newBlog.content);
          blog.author.firstNameshould.equal(newBlog.author.firstName);
          blog.author.lastNameshould.equal(newBlog.author.lastName);
        });
    });
  });

  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing blog from db
    //  2. Make a PUT request to update that blog
    //  3. Prove blog returned by request contains data we sent
    //  4. Prove blog in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        title: 'fofofofofofofof',
        content: 'Testing 1, 2, 3..'
      };

      return Blog
        .findOne()
        .exec()
        .then(function(blog) {
          updateData.id = blog.id;

          return chai.request(app)
            .put(`/blogs/${blog.id}`)
            .send(updateData);
        })
        .then(function(res) {
          res.should.have.status(204);

          return Blog.findById(updateData.id).exec();
        })
        .then(function(blog) {
          blog.title.should.equal(updateData.title);
          blog.content.should.equal(updateData.content);
        });
      });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a blog
    //  2. make a DELETE request for that blog's id
    //  3. assert that response has right status code
    //  4. prove that blog with the id doesn't exist in db anymore
    it('delete a blog by id', function() {

      let blog;

      return Blog
        .findOne()
        .exec()
        .then(function(_blog) {
          blog = _blog;
          return chai.request(app).delete(`/blogs/${blog.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return Blog.findById(blog.id).exec();
        })
        .then(function(_blog) {
          should.not.exist(_blog);
        });
    });
  });
});
