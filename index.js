const express = require("express");
const { connection } = require("./config/db");
const { SignUpModel } = require("./Models/SignupModel");
var jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Auth } = require("./Authentication/Auth");
const { UserModel } = require("./Models/UserModel");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to my mongodb");
});

//   SignUp Method

app.post("/signup", async (req, res) => {
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password, 5);
  try {
    const signUser = new SignUpModel({
      name: name,
      email: email,
      password: hash,
    });

    await signUser.save();
    res.status(200).json({ msg: "Successfully signed up" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error signing" });
  }
});

// Login Method

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await SignUpModel.findOne({ email });
  if (user) {
    // console.log(user._id)
    const hashPassword = user.password;
    bcrypt.compare(password, hashPassword, function (err, result) {
      if (result) {
        var token = jwt.sign({ user_id: user._id }, "Dibakar");
        res.json({ token: token });
        console.log(token);
      }
      if (err) {
        res.status(200).json({ msg: "error" });
        // console.log(err)
      }
    });
  }
});

// .................................................................................

app.get("/user", Auth, async (req, res) => {
  const { search, sortby, page, limit, order, completed } = req.query;

  let pageno = parseInt(page) || 1;
  let limitperpage = parseInt(limit) || 10;
  let skip = (pageno - 1) * limitperpage;

  try {
    let user;
    let query = {};

    if (search) {
      const regexp = new RegExp(search, "i");
      query.title = regexp;
    }

    // Add filtering based on task completion
    if (completed !== undefined && completed !== '') {
      query.completed = completed === 'true'; // Convert string to boolean
    }

    let sortquery = {};

    if (sortby) {
      sortquery[sortby] = order === "asc" ? 1 : -1;
    } else {
      // Default sorting by creation time if no sorting parameter is provided
      sortquery.createdAt = -1; // Descending order by default
    }

    user = await UserModel.find(query)
      .sort(sortquery)
      .skip(skip)
      .limit(limitperpage);

    const total = await UserModel.countDocuments(query);

    res.json({
      total,
      page: pageno,
      limitperpage,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/user/create", Auth, async (req, res) => {
  const { title, completed, description } = req.body;

  if (!title || !completed || !description) {
    return res.status(400).json({ error: "Title, completed, and description are required" });
  }

  const author_id = req.user_id;
  const user = await SignUpModel.findOne({ _id: author_id });

  const user_blog = new UserModel({
    title,
    completed,
    description,
    email: user.email,
  });
  await user_blog.save();
  res.status(200).json({ msg: "Successfully created" });
});

app.put("/user/edit/:id", Auth, async (req, res) => {
    const { title, completed, description } = req.body;
    
    if (!title || !completed || !description) {
      return res.status(400).json({ error: "Title, completed, and description are required" });
    }
  
    try {
      const edit_id = req.params.id;
      const user_id = req.user_id;
      const sign_user = await SignUpModel.findOne({ _id: user_id });
      const sign_email = sign_user.email;
  
      const user = await UserModel.findOne({ _id: edit_id });
      const user_email = user.email;
  
      if (sign_email === user_email) {
        await UserModel.findByIdAndUpdate(edit_id, req.body);
        res.status(200).json({ msg: "Updated successfully" });
      } else {
        res.status(403).send("Unauthorized");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  });

app.delete("/user/delete/:id", Auth, async (req, res) => {
  try {
    const delete_id = req.params.id;

    const user_id = req.user_id;
    const sign_user = await SignUpModel.findOne({ _id: user_id });
    const sign_email = sign_user.email;

    const user = await UserModel.findOne({ _id: delete_id });
    const user_mail = user.email;

    if (user_mail === sign_email) {
      await UserModel.findByIdAndDelete({ _id: delete_id });
      res.send("deleted successfully");
    } else {
      res.send("deleted error");
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(8080, async () => {
  await connection;
  try {
    console.log("Connected successfully");
  } catch (error) {
    console.log(error);
  }
});
