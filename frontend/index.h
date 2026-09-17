<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>CaptionAI</title>

<style>
*{
  box-sizing:border-box;
  margin:0;
  padding:0;
  font-family:Arial,Helvetica,sans-serif;
}

body{
  background:#f5f7fb;
  color:#151827;
  min-height:100vh;
}

.app{
  max-width:480px;
  margin:auto;
  min-height:100vh;
  background:#f5f7fb;
  padding-bottom:90px;
}

/* HEADER */
.header{
  padding:22px 18px 14px;
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.logo{
  font-size:25px;
  font-weight:800;
}

.logo span{
  color:#6c4cff;
}

.pro{
  background:#151827;
  color:white;
  padding:8px 13px;
  border-radius:20px;
  font-size:12px;
  font-weight:bold;
}

/* HERO */
.hero{
  margin:8px 16px 18px;
  padding:22px;
  border-radius:24px;
  background:linear-gradient(135deg,#6c4cff,#9b72ff);
  color:white;
  box-shadow:0 12px 30px rgba(108,76,255,.22);
}

.hero small{
  opacity:.85;
}

.hero h1{
  font-size:25px;
  margin:8px 0;
}

.hero p{
  font-size:13px;
  opacity:.9;
  line-height:1.5;
}

/* SECTION */
.section{
  padding:0 16px;
}

.section-title{
  font-size:18px;
  font-weight:800;
  margin:18px 2px 12px;
}

/* CREATE CARDS */
.create-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
}

.create-card{
  background:white;
  padding:18px;
  border-radius:20px;
  box-shadow:0 5px 18px rgba(20,20,50,.06);
  border:1px solid #eeeef5;
  cursor:pointer;
  transition:.2s;
}

.create-card:active{
  transform:scale(.97);
}

.icon{
  width:45px;
  height:45px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:14px;
  background:#f0ecff;
  font-size:23px;
  margin-bottom:12px;
}

.create-card h3{
  font-size:15px;
  margin-bottom:5px;
}

.create-card p{
  color:#777b8a;
  font-size:11px;
  line-height:1.4;
}

/* CATEGORIES */
.categories{
  display:flex;
  gap:9px;
  overflow-x:auto;
  padding-bottom:4px;
  scrollbar-width:none;
}

.categories::-webkit-scrollbar{
  display:none;
}

.category{
  white-space:nowrap;
  background:white;
  border:1px solid #e7e7ef;
  padding:10px 15px;
  border-radius:20px;
  font-size:12px;
  font-weight:600;
}

.category.active{
  background:#151827;
  color:white;
  border-color:#151827;
}

/* GENERATOR */
.generator{
  margin-top:18px;
  background:white;
  border-radius:22px;
  padding:18px;
  box-shadow:0 5px 18px rgba(20,20,50,.06);
}

.generator h2{
  font-size:18px;
  margin-bottom:6px;
}

.generator p{
  color:#777b8a;
  font-size:12px;
  margin-bottom:14px;
}

textarea{
  width:100%;
  height:90px;
  resize:none;
  border:1px solid #e2e2eb;
  border-radius:15px;
  padding:13px;
  font-size:13px;
  outline:none;
}

textarea:focus{
  border-color:#6c4cff;
}

.generate{
  width:100%;
  margin-top:12px;
  border:none;
  background:#6c4cff;
  color:white;
  padding:14px;
  border-radius:15px;
  font-size:14px;
  font-weight:bold;
}

/* RESULT */
.result{
  display:none;
  margin-top:14px;
  background:#f7f5ff;
  border-radius:15px;
  padding:14px;
}

.result p{
  color:#303244;
  line-height:1.5;
  margin:0;
}

/* BOTTOM NAV */
.bottom-nav{
  position:fixed;
  bottom:0;
  left:50%;
  transform:translateX(-50%);
  width:100%;
  max-width:480px;
  background:rgba(255,255,255,.96);
  backdrop-filter:blur(12px);
  border-top:1px solid #e8e8ef;
  display:flex;
  justify-content:space-around;
  padding:10px 5px 12px;
  z-index:10;
}

.nav-item{
  text-align:center;
  color:#858896;
  font-size:10px;
}

.nav-item div{
  font-size:20px;
  margin-bottom:3px;
}

.nav-item.active{
  color:#6c4cff;
  font-weight:bold;
}
</style>
</head>

<body>

<div class="app">

  <header class="header">
    <div class="logo">Caption<span>AI</span></div>
    <div class="pro">✦ PRO</div>
  </header>

  <section class="hero">
    <small>AI Caption Generator</small>
    <h1>Make your post<br>stand out ✨</h1>
    <p>Create engaging captions for photos, videos and social media in seconds.</p>
  </section>

  <section class="section">

    <div class="section-title">Create with AI</div>

    <div class="create-grid">

      <div class="create-card" onclick="selectType('Photo')">
        <div class="icon">📸</div>
        <h3>Photo Caption</h3>
        <p>Create a perfect caption for your photo.</p>
      </div>

      <div class="create-card" onclick="selectType('Video')">
        <div class="icon">🎬</div>
        <h3>Video Caption</h3>
        <p>Get catchy captions for Reels & Shorts.</p>
      </div>

      <div class="create-card" onclick="selectType('Status')">
        <div class="icon">💬</div>
        <h3>WhatsApp Status</h3>
        <p>Emotional and stylish status ideas.</p>
      </div>

      <div class="create-card" onclick="selectType('Trending')">
        <div class="icon">🔥</div>
        <h3>Trending Caption</h3>
        <p>Generate viral-style social captions.</p>
      </div>

    </div>

    <div class="section-title">Choose a mood</div>

    <div class="categories">
      <div class="category active" onclick="setMood(this,'Love')">❤️ Love</div>
      <div class="category" onclick="setMood(this,'Sad')">🥀 Sad</div>
      <div class="category" onclick="setMood(this,'Attitude')">😎 Attitude</div>
      <div class="category" onclick="setMood(this,'Funny')">😂 Funny</div>
      <div class="category" onclick="setMood(this,'Trending')">🔥 Trending</div>
    </div>

    <div class="generator">

      <h2 id="generatorTitle">Generate Caption</h2>
      <p id="generatorText">Tell us what your post is about.</p>

      <textarea id="idea" placeholder="Example: Sunset photo with my best friend..."></textarea>

      <button class="generate" onclick="generateDemo()">
        ✨ Generate Caption
      </button>

      <div class="result" id="result">
        <p id="resultText"></p>
      </div>

    </div>

  </section>

</div>

<nav class="bottom-nav">

  <div class="nav-item active">
    <div>⌂</div>
    Home
  </div>

  <div class="nav-item">
    <div>✨</div>
    Create
  </div>

  <div class="nav-item">
    <div>♡</div>
    Favorites
  </div>

  <div class="nav-item">
    <div>👤</div>
    Profile
  </div>

</nav>

<script>

let selectedMood = "Love";
let selectedType = "Caption";

function selectType(type){
  selectedType = type;
  document.getElementById("generatorTitle").innerText =
    "Generate " + type + " Caption";

  document.getElementById("generatorText").innerText =
    "Tell us what your " + type.toLowerCase() + " is about.";

  document.getElementById("idea").focus();
}

function setMood(element,mood){

  selectedMood = mood;

  document.querySelectorAll(".category").forEach(function(item){
    item.classList.remove("active");
  });

  element.classList.add("active");
}

function generateDemo(){

  const idea = document.getElementById("idea").value.trim();

  if(!idea){
    alert("Please describe your photo or video first.");
    return;
  }

  const captions = {
    Love: "Some moments become memories, and some people become a part of your heart. ❤️✨",
    Sad: "Sometimes a smile hides a story that words can never explain. 🥀",
    Attitude: "I don't follow the crowd. I create my own way. 😎🔥",
    Funny: "Life is too short to take every picture seriously. 😂📸",
    Trending: "Creating moments today that everyone will remember tomorrow. 🔥✨"
  };

  document.getElementById("resultText").innerText =
    captions[selectedMood];

  document.getElementById("result").style.display = "block";
}

</script>

</body>
</html>
