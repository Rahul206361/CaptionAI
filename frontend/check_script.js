
let selectedMood = "Love";
let selectedType = "Photo";
function showHome(){
  document.getElementById("historyPage").style.display = "none";
  document.getElementById("favoritesPage").style.display = "none";
  document.getElementById("profilePage").style.display = "none";

  document.querySelector("main").style.display = "block";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function showCreate(){
  document.getElementById("historyPage").style.display = "none";
  document.getElementById("favoritesPage").style.display = "none";
  document.getElementById("profilePage").style.display = "none";

  document.querySelector("main").style.display = "block";

  setTimeout(function(){
    const generator = document.getElementById("generatorBox");

    if(generator){
      generator.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, 100);
}

let selectedLanguage = "English";

function selectType(type){

  selectedType = type;

  const titles = {
    "Photo": "Generate Photo Caption",
    "Video": "Generate Reels Caption",
    "WhatsApp Status": "Generate WhatsApp Status",
    "Shayari": "Generate Shayari",
    "Instagram Bio": "Generate Instagram Bio",
    "Hashtags": "Generate Hashtags"
  };

  const placeholders = {
    "Photo": "Example: Sunset with my best friend",
    "Video": "Example: Dancing at a wedding",
    "WhatsApp Status": "Example: Missing someone special",
    "Shayari": "Example: One-sided love and heartbreak",
    "Instagram Bio": "Example: Love travel photography and music",
    "Hashtags": "Example: Sunset photo at the beach"
  };

  document.getElementById("generatorTitle").innerText =
    titles[type] || "Generate Content";

  document.getElementById("generatorText").innerText =
    "Tell us what your " + type.toLowerCase() + " is about.";

  document.getElementById("idea").placeholder =
    placeholders[type] || "Describe your idea here...";

  document.getElementById("idea").focus();
}

function setLanguage(element,language){
  selectedLanguage = language;

  document.querySelectorAll("#languages .category").forEach(function(item){
    item.classList.remove("active");
  });

  element.classList.add("active");
}

function setMood(element,mood){

  selectedMood = mood;

  document.querySelectorAll("#moods .category").forEach(function(item){
    item.classList.remove("active");
  });

  element.classList.add("active");
}

async function generateCaption(){

  const idea = document.getElementById("idea").value.trim();

  if(!idea){
    alert("Please describe your idea first.");
    return;
  }

  const button = document.querySelector(".generate");

  button.disabled = true;
  button.innerText = "✨ Generating...";

  try{

    const response = await fetch(
      "https://press-receiver-sprint-int.trycloudflare.com/api/generate-caption",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          idea:idea,
          mood:selectedMood,
          type:selectedType,
          language:selectedLanguage
        })
      }
    );

    const data = await response.json();

    if(!data.success){
      alert(data.message || "Something went wrong.");
      return;
    }

    document.getElementById("resultText").innerText =
      data.caption || "";

    let generated =
      parseInt(localStorage.getItem("captionAI_generated") || "0");

    localStorage.setItem(
      "captionAI_generated",
      generated + 1
    );

    document.getElementById("result").style.display = "block";

    let history = JSON.parse(
      localStorage.getItem("captionAI_history") || "[]"
    );

    history.unshift({
      text: data.caption || "",
      type: selectedType,
      mood: selectedMood,
      date: new Date().toLocaleString()
    });

    if(history.length > 50){
      history = history.slice(0,50);
    }

    localStorage.setItem("captionAI_history", JSON.stringify(history));
    showRecentGenerations();
    document.getElementById("copyBtn").style.display = "block";
      document.getElementById("saveBtn").style.display = "block";

    document.getElementById("result").scrollIntoView({
      behavior:"smooth",
      block:"center"
    });

  }catch(error){

    document.getElementById("resultText").innerText =
      "ERROR: " + error.message;

    document.getElementById("result").style.display = "block";

  }finally{

    button.disabled = false;
    button.innerText = "✨ Generate Content";

  }
}

function saveFavorite(){

  const text = document.getElementById("resultText").innerText.trim();

  if(!text){
    alert("Please generate something first.");
    return;
  }

  let favorites = JSON.parse(
    localStorage.getItem("captionAI_favorites") || "[]"
  );

  const item = {
    text: text,
    type: selectedType,
    mood: selectedMood,
    folder: "General",
    date: new Date().toLocaleString()
  };

  favorites.unshift(item);

  localStorage.setItem(
    "captionAI_favorites",
    JSON.stringify(favorites)
  );

  const button = document.getElementById("saveBtn");
  button.innerText = "❤️ Saved!";
  
  setTimeout(function(){
    button.innerText = "❤️ Save to Favorites";
  }, 1500);
}

function getFavorites(){

  return JSON.parse(
    localStorage.getItem("captionAI_favorites") || "[]"
  );
}


function clearFavorites(){

  if(!confirm("Delete all saved favorites?")){
    return;
  }

  localStorage.removeItem("captionAI_favorites");

  const profileFavorites = document.getElementById("profileFavorites");
  if(profileFavorites){
    profileFavorites.innerText = "0";
  }

  showFavorites();
}

function showFavorites(){

  const page = document.getElementById("favoritesPage");
  const home = document.querySelector("main");

  const favorites = getFavorites();
  const list = document.getElementById("favoritesList");

  const searchBox = document.getElementById("favoriteSearch");
  const search = searchBox ? searchBox.value.trim().toLowerCase() : "";

  const folderBox = document.getElementById("favoriteFolder");
  const selectedFolder = folderBox ? folderBox.value : "All";

  const filteredFavorites = favorites.filter(function(item){

    const itemFolder = item.folder || "General";

    const matchesFolder =
      selectedFolder === "All" ||
      itemFolder === selectedFolder ||
      (!item.folder && selectedFolder === "General");

    const matchesSearch =
      String(item.text || "").toLowerCase().includes(search) ||
      String(item.type || "").toLowerCase().includes(search) ||
      String(item.mood || "").toLowerCase().includes(search);

    return matchesFolder && matchesSearch;
  });

  page.style.display = "block";
  home.style.display = "none";
  document.getElementById("profilePage").style.display = "none";
  document.getElementById("historyPage").style.display = "none";

  if(filteredFavorites.length === 0){
    list.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <div class="card-icon">❤️</div>
        <div class="card-title">No Favorites Yet</div>
        <div class="card-sub">
          Generate a caption and tap "Save to Favorites".
        </div>
      </div>
    `;
    return;
  }

  list.innerHTML = filteredFavorites.map(function(item){

    const index = favorites.indexOf(item);

    return `
      <div class="card" style="margin-bottom:15px;text-align:left;">
        <div style="font-size:13px;opacity:.65;margin-bottom:8px;">
          ${item.type} • ${item.mood} • 📁 ${item.folder || "General"}
        </div>

        <div style="line-height:1.6;white-space:pre-wrap;">
          ${escapeHTML(item.text)}
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:15px;">

          <button class="copy-btn"
            onclick="copyFavorite(${index})">
            📋 Copy
          </button>

          <button class="copy-btn"
            onclick="shareFavorite(${index})">
            📤 Share
          </button>

          <button class="copy-btn"
            onclick="moveFavorite(${index})">
            📁 Move
          </button>

          <button class="copy-btn"
            onclick="deleteFavorite(${index})">
            🗑️ Delete
          </button>

        </div>
      </div>
    `;

  }).join("");
}

function escapeHTML(text){

  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}

function copyFavorite(index){

  const favorites = getFavorites();

  if(!favorites[index]){
    return;
  }

  navigator.clipboard.writeText(favorites[index].text)
    .then(function(){
      alert("❤️ Favorite copied!");
    })
    .catch(function(){
      alert("Copy failed.");
    });
}

function shareFavorite(index){

  const favorites = getFavorites();

  if(!favorites[index]){
    return;
  }

  const text = favorites[index].text;

  if(navigator.share){
    navigator.share({
      title: "CaptionAI Favorite",
      text: text
    }).catch(function(error){
      if(error && error.name !== "AbortError"){
        alert("Share failed.");
      }
    });
  }else{
    navigator.clipboard.writeText(text)
      .then(function(){
        alert("📋 Caption copied. You can share it anywhere.");
      })
      .catch(function(){
        alert("Share is not supported on this device.");
      });
  }
}

function moveFavorite(index){

  const folders = [
    "General",
    "Love",
    "Sad",
    "Attitude",
    "Funny",
    "Friendship",
    "Motivation",
    "Romantic",
    "Travel",
    "Birthday",
    "Festival",
    "Trending"
  ];

  const choice = prompt(
    "Move favorite to folder:\n\n" +
    folders.map((f, i) => (i + 1) + ". " + f).join("\n")
  );

  if(choice === null){
    return;
  }

  const number = parseInt(choice, 10);

  if(!number || number < 1 || number > folders.length){
    alert("Invalid folder.");
    return;
  }

  const favorites = getFavorites();

  if(!favorites[index]){
    return;
  }

  favorites[index].folder = folders[number - 1];

  localStorage.setItem(
    "captionAI_favorites",
    JSON.stringify(favorites)
  );

  showFavorites();
}

function deleteFavorite(index){

  let favorites = getFavorites();

  favorites.splice(index, 1);

  localStorage.setItem(
    "captionAI_favorites",
    JSON.stringify(favorites)
  );

  showFavorites();
}

function closeFavorites(){

  document.getElementById("favoritesPage").style.display = "none";
  document.querySelector("main").style.display = "block";
}

async function copyCaption(){

  const text = document.getElementById("resultText").innerText;

  try{

    await navigator.clipboard.writeText(text);

    alert("Caption copied!");

  }catch(error){

    alert("Unable to copy caption.");

  }
}


function showProfile(){

  const profile = document.getElementById("profilePage");
  const main = document.querySelector("main");

  main.style.display = "none";
  document.getElementById("favoritesPage").style.display = "none";
  document.getElementById("historyPage").style.display = "none";
  profile.style.display = "block";

  const userText = localStorage.getItem("captionai_user");

  if(userText){
    try{
      const user = JSON.parse(userText);

      const profileName = document.getElementById("profileName");
      const profileEmail = document.getElementById("profileEmail");

      if(profileName){
        profileName.innerText = user.name || "CaptionAI User";
      }

      if(profileEmail){
        profileEmail.innerText = user.email || "✨ AI Content Creator";
      }
    }catch(e){}
  }

  const favorites = JSON.parse(
    localStorage.getItem("captionAI_favorites") || "[]"
  );

  document.getElementById("profileFavorites").innerText =
    favorites.length;

  document.getElementById("profileGenerated").innerText =
    localStorage.getItem("captionAI_generated") || "0";

  const history = JSON.parse(
    localStorage.getItem("captionAI_history") || "[]"
  );

  document.getElementById("profileHistory").innerText =
    history.length;
}

function showEditProfile(){
  const userText = localStorage.getItem("captionai_user");

  if(!userText){
    toast("Please login first");
    openAuth();
    return;
  }

  let user = {};

  try{
    user = JSON.parse(userText);
  }catch(e){
    toast("Unable to load profile");
    return;
  }

  let box = document.getElementById("editProfileBox");

  if(!box){
    box = document.createElement("div");
    box.id = "editProfileBox";
    box.className = "card";
    box.style.marginBottom = "18px";

    box.innerHTML = `
      <div class="card-title">✏️ Edit Profile</div>

      <input id="editProfileName"
        type="text"
        placeholder="Your name"
        style="width:100%;box-sizing:border-box;margin-top:12px;padding:13px;border:1px solid #ddd;border-radius:10px;">

      <input id="editProfileEmail"
        type="email"
        readonly
        style="width:100%;box-sizing:border-box;margin-top:12px;padding:13px;border:1px solid #ddd;border-radius:10px;opacity:.65;">

      <button onclick="saveProfile()"
        style="margin-top:12px;width:100%;padding:13px;border:0;border-radius:10px;font-weight:800;cursor:pointer;">
        💾 Save Profile
      </button>

      <button onclick="closeEditProfile()"
        style="margin-top:8px;width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;font-weight:800;cursor:pointer;background:transparent;">
        Cancel
      </button>
    `;

    document.getElementById("profilePage").prepend(box);
  }

  document.getElementById("editProfileName").value = user.name || "";
  document.getElementById("editProfileEmail").value = user.email || "";

  box.style.display = "block";
  box.scrollIntoView({behavior:"smooth", block:"center"});
}

function closeEditProfile(){
  const box = document.getElementById("editProfileBox");
  if(box){
    box.style.display = "none";
  }
}

function saveProfile(){
  const name = document.getElementById("editProfileName").value.trim();

  if(!name){
    toast("Please enter your name");
    return;
  }

  const userText = localStorage.getItem("captionai_user");

  if(!userText){
    toast("Please login first");
    return;
  }

  try{
    const user = JSON.parse(userText);
    user.name = name;

    localStorage.setItem("captionai_user", JSON.stringify(user));

    const profileName = document.getElementById("profileName");
    if(profileName){
      profileName.innerText = name;
    }

    const accountTitle = document.getElementById("accountTitle");
    if(accountTitle){
      accountTitle.innerHTML = "👤 " + name;
    }

    closeEditProfile();
    toast("Profile updated successfully");
  }catch(e){
    toast("Unable to save profile");
  }
}

function closeProfile(){

  document.getElementById("profilePage").style.display = "none";
  document.querySelector("main").style.display = "block";
}

function toggleTheme(){

  document.body.classList.toggle("dark-mode");

  localStorage.setItem(
    "captionAI_darkMode",
    document.body.classList.contains("dark-mode") ? "1" : "0"
  );
}

function loadTheme(){

  if(localStorage.getItem("captionAI_darkMode") === "1"){
    document.body.classList.add("dark-mode");
  }
}

loadTheme();


function getHistory(){
  return JSON.parse(
    localStorage.getItem("captionAI_history") || "[]"
  );
}

function openRecent(index){
  const history = getHistory();
  if(!history[index]){ return; }
  document.getElementById("resultText").innerText = history[index].text || "";
  document.getElementById("result").style.display = "block";
  document.getElementById("result").scrollIntoView({behavior:"smooth",block:"center"});
}

function showRecentGenerations(){

  const list = document.getElementById("recentList");

  if(!list){
    return;
  }

  const history = getHistory().slice(0,3);

  if(history.length === 0){
    list.innerHTML = '<div class="card-sub">Your recent generations will appear here.</div>';
    return;
  }

  list.innerHTML = history.map(function(item){

    const index = getHistory().indexOf(item);

    return `
      <div class="card" style="margin-bottom:12px;text-align:left;cursor:pointer;" onclick="openRecent(index)">
        <div style="font-size:12px;opacity:.65;margin-bottom:7px;">
          ${escapeHTML(item.type)} • ${escapeHTML(item.mood)}
        <div style="font-size:11px;opacity:.5;margin-bottom:8px;">🕐 ${escapeHTML(item.date || "")}</div>
        </div>
        <button class="copy-btn" style="display:block;margin-top:10px;" onclick="event.stopPropagation();copyHistory(index)">📋 Copy</button>
        <button class="copy-btn" style="display:block;margin-top:8px;" onclick="event.stopPropagation();shareHistory(index)">📤 Share</button>
      </div>
    `;
  }).join("");
}

function showHistory(){

  const historyPage = document.getElementById("historyPage");
  const main = document.querySelector("main");
  const list = document.getElementById("historyList");

  main.style.display = "none";
  document.getElementById("favoritesPage").style.display = "none";
  document.getElementById("profilePage").style.display = "none";
  historyPage.style.display = "block";

  const history = getHistory();

  const searchBox = document.getElementById("historySearch");
  const search = searchBox ? searchBox.value.trim().toLowerCase() : "";

  const typeBox = document.getElementById("historyType");
  const selectedType = typeBox ? typeBox.value : "All";

  const filteredHistory = history.filter(function(item){

    const matchesType =
      selectedType === "All" ||
      String(item.type || "") === selectedType;

    const matchesSearch =
      String(item.text || "").toLowerCase().includes(search) ||
      String(item.type || "").toLowerCase().includes(search) ||
      String(item.mood || "").toLowerCase().includes(search);

    return matchesType && matchesSearch;
  });

  if(filteredHistory.length === 0){
    list.innerHTML = `
      <div class="card" style="text-align:center;">
        <div class="card-icon">🕘</div>
        <div class="card-title">${history.length === 0 ? "No History Yet" : "No Matching History"}</div>
        <div class="card-sub">
          Your generated content will appear here.
        </div>
      </div>
    `;
    return;
  }

  list.innerHTML = filteredHistory.map(function(item){
    const index = history.indexOf(item);
    return `
      <div class="card" style="margin-bottom:15px;text-align:left;">
        <div style="font-size:13px;opacity:.65;margin-bottom:8px;">
          ${escapeHTML(item.type)} • ${escapeHTML(item.mood)}
        <div style="font-size:11px;opacity:.5;margin-bottom:8px;">🕐 ${escapeHTML(item.date || "")}</div>
        </div>

        <div style="line-height:1.6;white-space:pre-wrap;">
          ${escapeHTML(item.text)}
        </div>

        <div style="font-size:12px;opacity:.55;margin-top:10px;">
          ${escapeHTML(item.date)}
        </div>

        <div style="display:flex;gap:8px;margin-top:15px;">
          <button class="copy-btn" style="display:block;"
            onclick="copyHistory(${index})">
        <button class="copy-btn" style="display:block;margin-top:8px;" onclick="event.stopPropagation();shareHistory(index)">📤 Share</button>
            📋 Copy
          </button>

          <button class="copy-btn" style="display:block;"
            onclick="shareHistory(${index})">
            📤 Share
          </button>

          <button class="copy-btn" style="display:block;"
            onclick="deleteHistory(${index})">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function copyHistory(index){

  const history = getHistory();

  if(!history[index]) return;

  navigator.clipboard.writeText(history[index].text)
    .then(function(){
      alert("🕘 History copied!");
    })
    .catch(function(){
      alert("Copy failed.");
    });
}

function shareHistory(index){

  const history = getHistory();

  if(!history[index]){
    return;
  }

  const text = history[index].text;

  if(navigator.share){
    navigator.share({
      title: "CaptionAI History",
      text: text
    }).catch(function(error){
      if(error && error.name !== "AbortError"){
        alert("Share failed.");
      }
    });
  }else{
    navigator.clipboard.writeText(text)
      .then(function(){
        alert("📋 Caption copied. You can share it anywhere.");
      })
      .catch(function(){
        alert("Share is not supported on this device.");
      });
  }
}

function deleteHistory(index){

  let history = getHistory();

  history.splice(index,1);

  localStorage.setItem(
    "captionAI_history",
    JSON.stringify(history)
  );

  showHistory();
}

function clearHistory(){

  if(!confirm("Delete all generation history?")){
    return;
  }

  localStorage.removeItem("captionAI_history");

  const profileHistory = document.getElementById("profileHistory");
  if(profileHistory){
    profileHistory.innerText = "0";
  }

  showHistory();
}

function closeHistory(){

  document.getElementById("historyPage").style.display = "none";
  document.querySelector("main").style.display = "block";
}


const AUTH_API = "http://127.0.0.1:5000";

function openAuth(){
  const modal = document.getElementById("authModal");
  if(modal) modal.style.display = "block";

  if(localStorage.getItem("captionai_token")){
    updateAccountCard();
  }else{
    showLogin();
  }
}

function closeAuth(){
  const modal = document.getElementById("authModal");
  if(modal) modal.style.display = "none";
}

function showLogin(){
  document.getElementById("authLogin").style.display = "block";
  document.getElementById("authRegister").style.display = "none";
}

function showRegister(){
  document.getElementById("authLogin").style.display = "none";
  document.getElementById("authRegister").style.display = "block";
}

function showForgotPassword(){
  const email = document.getElementById("loginEmail").value.trim();

  document.getElementById("authLogin").style.display = "none";
  document.getElementById("authRegister").style.display = "none";

  let box = document.getElementById("authForgot");

  if(!box){
    box = document.createElement("div");
    box.id = "authForgot";
    box.innerHTML = `
      <div style="font-size:20px;font-weight:800;margin-bottom:6px;">Forgot Password</div>
      <div style="opacity:.65;margin-bottom:18px;">Enter your email to reset your password</div>

      <input id="forgotEmail" type="email" placeholder="Gmail / Email"
        style="width:100%;padding:13px;margin-bottom:12px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;">

      <button onclick="requestPasswordReset()"
        style="width:100%;padding:14px;border:0;border-radius:12px;font-weight:800;cursor:pointer;">
        Send Reset Link
      </button>

      <div style="text-align:center;margin-top:16px;">
        <span onclick="showLogin()" style="font-weight:800;cursor:pointer;">← Back to Login</span>
      </div>
    `;
    document.querySelector("#authLogin").parentElement.appendChild(box);
  }

  document.getElementById("forgotEmail").value = email;
  box.style.display = "block";
}

async function requestPasswordReset(){
  const email=document.getElementById("forgotEmail").value.trim();
  if(!email || !email.includes("@")){ toast("Please enter a valid email"); return; }
  try{
    const res=await fetch(AUTH_API+"/api/forgot-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
    const data=await res.json();
    if(!data.success){ toast(data.message||"Password reset failed"); return; }
    if(data.reset_token){ localStorage.setItem("captionai_reset_token",data.reset_token); toast("Reset token created"); showResetPassword(); }
    else toast(data.message||"If the email is registered, a reset link will be sent.");
  }catch(e){ toast("ERROR: " + e.message); }
}

function showResetPassword(){
  document.getElementById("authLogin").style.display="none";
  document.getElementById("authRegister").style.display="none";

  const forgot=document.getElementById("authForgot");
  if(forgot) forgot.style.display="none";

  let box=document.getElementById("authReset");

  if(!box){
    box=document.createElement("div");
    box.id="authReset";
    box.innerHTML=`<div style="font-size:20px;font-weight:800;margin-bottom:6px;">Reset Password</div>
<div style="opacity:.65;margin-bottom:18px;">Create a new password</div>
<input id="resetPassword" type="password" placeholder="New Password" style="width:100%;padding:13px;margin-bottom:12px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;">
<input id="resetPassword2" type="password" placeholder="Confirm New Password" style="width:100%;padding:13px;margin-bottom:12px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;">
<button onclick="resetPasswordAccount()" style="width:100%;padding:14px;border:0;border-radius:12px;font-weight:800;cursor:pointer;">Reset Password</button>
<div style="text-align:center;margin-top:16px;"><span onclick="showLogin()" style="font-weight:800;cursor:pointer;">← Back to Login</span></div>`;
    document.querySelector("#authLogin").parentElement.appendChild(box);
  }

  box.style.display="block";
}

async function resetPasswordAccount(){
  const password=document.getElementById("resetPassword").value;
  const password2=document.getElementById("resetPassword2").value;
  const token=localStorage.getItem("captionai_reset_token");

  if(!token){ toast("Reset token missing"); return; }
  if(password.length<6){ toast("Password must be at least 6 characters"); return; }
  if(password!==password2){ toast("Passwords do not match"); return; }

  try{
    const res=await fetch(AUTH_API+"/api/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,password})});
    const data=await res.json();

    if(!data.success){ toast(data.message||"Password reset failed"); return; }

    localStorage.removeItem("captionai_reset_token");
    toast("Password reset successfully");
    showLogin();
  }catch(e){
    toast("Unable to connect to server");
  }
}

async function registerAccount(){
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

  if(!email || !password){
    toast("Please enter email and password");
    return;
  }

  try{
    const res = await fetch(AUTH_API + "/api/register", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name,email,password})
    });

    const data = await res.json();

    if(!data.success){
      toast(data.message || "Registration failed");
      return;
    }

    toast("Account created! Please verify your email.");
    showLogin();
  }catch(e){
    toast("Unable to connect to server");
  }
}

async function loginAccount(){
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if(!email || !password){
    toast("Please enter email and password");
    return;
  }

  try{
    const res = await fetch(AUTH_API + "/api/login", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email,password})
    });

    const data = await res.json();

    if(!data.success){
      toast(data.message || "Login failed");
      return;
    }

    localStorage.setItem("captionai_token", data.token);
    localStorage.setItem("captionai_user", JSON.stringify(data.user));

    toast("Login successful");
    closeAuth();
    updateAccountCard();
  }catch(e){
    toast("Unable to connect to server");
  }
}

async function logoutAccount(){
  const token = localStorage.getItem("captionai_token");

  try{
    if(token){
      await fetch(AUTH_API + "/api/logout", {
        method:"POST",
        headers:{"Authorization":"Bearer " + token}
      });
    }
  }catch(e){}

  localStorage.removeItem("captionai_token");
  localStorage.removeItem("captionai_user");

  toast("Logged out successfully");
  closeAuth();
  updateAccountCard();
}

function updateAccountCard(){
  const title = document.getElementById("accountTitle");
  const sub = document.getElementById("accountSub");

  if(!title || !sub) return;

  const userText = localStorage.getItem("captionai_user");

  if(userText){
    try{
      const user = JSON.parse(userText);
      title.innerHTML = "👤 " + (user.name || "My Account");
      sub.innerHTML = user.email;
      const btn = document.getElementById("accountButton");
      if(btn){
        btn.innerHTML = "Logout";
        btn.onclick = logoutAccount;
      }
    }catch(e){
      title.innerHTML = "🔐 Login / Create Account";
      sub.innerHTML = "Login with your Gmail or email address";
    }
  }else{
    title.innerHTML = "🔐 Login / Create Account";
    sub.innerHTML = "Login with your Gmail or email address";
    const btn = document.getElementById("accountButton");
    if(btn){
      btn.innerHTML = "Login / Create Account";
      btn.onclick = openAuth;
    }
  }
}

document.addEventListener("DOMContentLoaded", updateAccountCard);
