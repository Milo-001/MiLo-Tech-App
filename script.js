let totalLogins = 0;
let currentUser = "Guest";
let selectedUser = null;
async function signupMessage() {

  const phone = document.getElementById("signup-phone-number").value;
  const password = document.getElementById("signup-password").value;
  // Validate Nigerian phone number
const phonePattern = /^(070|080|081|090|091|071)[0-9]{8}$/;

if (!phonePattern.test(phone)) {
  showNotification("Please enter a valid phone number.");
  return;
}
// Check if phone number already exists
const existingUser = query(
  collection(db, "users"),
  where("phone", "==", phone)
);

const existingSnapshot = await getDocs(existingUser);

if (!existingSnapshot.empty) {
  showNotification("This phone number is already registered. Please log in.");
  return;
}
  if (phone === "" || password === "") {

    showNotification("Please enter phone number and password!");

    return;

  }


  // Save user details
  localStorage.setItem("phone-number", phone);
  localStorage.setItem("password", password);
try {

  await addDoc(collection(db, "users"), {
    phone: phone,
    password: password,
    status: "Online",
    joined: serverTimestamp()
  });

} catch (error) {

  console.log(error);

}

  // Set current user
  currentUser = phone;
  window.setDoc(
  window.doc(window.db, "users", currentUser),
  {
    online: true,
    lastSeen: window.serverTimestamp()
  },
  { merge: true }
);
window.addEventListener("beforeunload", () => {
  window.setDoc(
    window.doc(window.db, "users", currentUser),
    {
      online: false,
      lastSeen: window.serverTimestamp()
    },
    { merge: true }
  );
});


  // Update profile
  const profilePhone = document.getElementById("profile-phone");

  if (profilePhone) {

    profilePhone.innerText = "Phone: " + phone;

  }


  // Change status to online
  const status = document.getElementById("profile-status");
  const dot = document.getElementById("status-dot");


  if (status) {

    status.innerText = "Online";

  }


  if (dot) {

    dot.classList.remove("offline-dot");
    dot.classList.add("online-dot");

  }


  // Hide signup/login page
  document.getElementById("auth-page").style.display = "none";


  // Show app
  document.getElementById("app-page").style.display = "block";


  // Open home page with slider
  showSection("home-page");


  showNotification("Signup Successful!");

}

async function loginMessage() {

  const phone = document.getElementById("login-phone-number").value;
  const password = document.getElementById("login-password").value;

  try {

    const q = query(
      collection(db, "users"),
      where("phone", "==", phone),
      where("password", "==", password)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
    const userDoc = snapshot.docs[0];
    await updateDoc(
  doc(db, "users", userDoc.id),
  {
    lastLogin: Timestamp.now(),
    status: "Online"
  }
);
      currentUser = phone;

      localStorage.setItem("phone-number", phone);
      localStorage.setItem("password", password);

      document.getElementById("profile-status").innerText = "Online";
      document.getElementById("status-dot").classList.remove("offline-dot");
      document.getElementById("status-dot").classList.add("online-dot");

      document.getElementById("profile-phone").innerText =
        "Phone: " + phone;

      document.getElementById("auth-page").style.display = "none";
      document.getElementById("app-page").style.display = "block";

      showSection("home-page");

      totalLogins++;
      updateDashboard();

      showNotification("Login Successful!");

    } else {

      showNotification("Incorrect Phone Number or Password!");

    }

  } catch (error) {

    console.log(error);
    showNotification("Login Error!");

  }

}

function togglePassword() {
  const password = document.getElementById("login-password");
  if (password.type === "password") { password.type = "text"; }
  else { password.type = "password"; }
}
function toggleSignupPassword() {

  const password = document.getElementById("signup-password");

  if (password.type === "password") {

    password.type = "text";

  } else {

    password.type = "password";

  }

}
async function logoutUser() {

  try {

    const q = query(
      collection(db, "users"),
      where("phone", "==", currentUser)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {

      const userDoc = snapshot.docs[0];

      await updateDoc(
        doc(db, "users", userDoc.id),
        {
          status: "Offline"
        }
      );

    }

  } catch (error) {

    console.log(error);

  }

  localStorage.removeItem("phone-number");
  localStorage.removeItem("password");

  currentUser = null;

  const status = document.getElementById("profile-status");
  const dot = document.getElementById("status-dot");

  if (status) {
    status.innerText = "Offline";
  }

  if (dot) {
    dot.classList.remove("online-dot");
    dot.classList.add("offline-dot");
  }

  document.getElementById("app-page").style.display = "none";

  document.getElementById("auth-page").style.display = "block";

  showSection("login-page");

  showNotification("Logged Out Successfully!");

}

async function updateProfile() {

  const newPhone = document.getElementById("edit-phone").value;

  if (newPhone === "") {
    showNotification("Please Enter A Phone Number");
    return;
  }

  try {

    const q = query(
      collection(db, "users"),
      where("phone", "==", currentUser)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {

      const userDoc = snapshot.docs[0];

      await updateDoc(
        doc(db, "users", userDoc.id),
        {
          phone: newPhone
        }
      );

      currentUser = newPhone;

      localStorage.setItem("phone-number", newPhone);

      document.getElementById("profile-phone").innerText =
        "Phone: " + newPhone;

      showNotification("Profile Updated Successfully!");

    } else {

      showNotification("User Not Found!");

    }

  } catch (error) {

    console.log(error);

    showNotification("Profile Update Failed!");

  }

}

async function updateDashboard() {

  try {

    // TOTAL USERS
    const usersSnapshot = await getDocs(
      collection(db, "users")
    );

    document.getElementById("total-users").innerText =
      usersSnapshot.size;

    // ONLINE USERS
    const onlineQuery = query(
      collection(db, "users"),
      where("status", "==", "Online")
    );

    const onlineSnapshot = await getDocs(onlineQuery);

    document.getElementById("online-users").innerText =
      onlineSnapshot.size;

        // TOTAL MESSAGES
    const messagesSnapshot = await getDocs(
      collection(db, "messages")
    );

    document.getElementById("total-messages").innerText =
      messagesSnapshot.size;
      
      

  } catch (error) {

    console.log(error);

  }

}

function showNotification(message) {
  const notification = document.getElementById("notification");
  notification.innerText = message;
  notification.classList.add("show");
  setTimeout(() => { notification.classList.remove("show"); }, 3000);
}

async function sendMessage(text) {
  if (!selectedUser) {
  showNotification("Select a user first");
  return;
}

const chatId = getPrivateChatId(currentUser, selectedUser);

  const chatInput = document.getElementById("chat-input");
 
  const typingDiv = document.getElementById("typing-indicator");
  const chatBox = document.getElementById("chat-box");
  const typingSound = document.getElementById("typing-sound");

  if (!text) text = chatInput.value;


  if (!text) return;

  await addDoc(collection(db, "privateChats", chatId, "messages"), {
  text: text,
  sender: currentUser,
  receiver: selectedUser,
  createdAt: serverTimestamp(),
  status: "sent"
});
    
    
    

  chatInput.value = "";
await setDoc(
  doc(db, "typingStatus", chatId),
  {
    typing: false,
    user: currentUser,
    time: serverTimestamp()
  },
  { merge: true }
);

  // FORCE TYPING TO STAY AT BOTTOM THEN SHOW IT
  if(typingDiv && typingDiv.parentElement!== chatBox) chatBox.appendChild(typingDiv);
  if(typingDiv) typingDiv.style.display = "block";
  if(typingSound) { typingSound.currentTime = 0; typingSound.play(); }
  if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
/*
const reply = getBotReply(text);

  // WAIT 2s THEN SEND REPLY AND HIDE TYPING + STOP SOUND
  setTimeout(async () => {
    if(typingDiv) typingDiv.style.display = "none";
    if(typingSound) { typingSound.pause(); typingSound.currentTime = 0; }

   await addDoc(collection(db, "privateChats", chatId, "messages"), {
  text: reply,
  sender: "Milo AI Bot",
  createdAt: serverTimestamp()
});

    if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  }, 2000);
}
*/
if (typingDiv) typingDiv.style.display = "none";
if (typingSound) {
  typingSound.pause();
  typingSound.currentTime = 0;
}
}
async function saveMessageToFirebase(text, sender) {
  try {
    await window.addDoc(
      window.collection(window.db, "messages"),
      {
        text: text,
        sender: sender,
        createdAt: window.serverTimestamp()
      }
    );
  } catch(error) { console.log(error); }
}

function loadMessages() {
  const chatBox = document.getElementById("chat-box");
  if (!selectedUser) return;

const chatId = getPrivateChatId(currentUser, selectedUser);

const q = window.query(
  window.collection(
    window.db,
    "privateChats",
    chatId,
    "messages"
  ),
  window.orderBy("createdAt", "asc")
);

  window.onSnapshot(q, (snapshot) => {
    const typing = document.getElementById("typing-indicator");
const typingRef = doc(db, "typingStatus", chatId);

onSnapshot(typingRef, (docSnap) => {
  const typingDiv = document.getElementById("typing-indicator");

  if (!typingDiv) return;

  if (docSnap.exists()) {
    const data = docSnap.data();

    if (data.typing && data.user !== currentUser) {
      typingDiv.innerText = data.user + " is typing...";
      typingDiv.style.display = "block";
    } else {
      typingDiv.style.display = "none";
    }
  } else {
    typingDiv.style.display = "none";
  }
});
    // BUILD ALL MESSAGES FIRST INSTEAD OF CLEARING
    let messagesHTML = "";
    let lastSender = "";

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!doc.metadata.hasPendingWrites &&!data.createdAt) return;

      let senderLabel = "";
      if (data.sender!== lastSender) {
        senderLabel = `<p style="font-size:12px;margin:0 8px 3px 8px;color:${data.sender === "Milo AI Bot"? "#2563eb" : "#22c55e"};font-weight:600;align-self:${data.sender === "Milo AI Bot"? "flex-end" : "flex-start"}">${data.sender}</p>`;
      }
      lastSender = data.sender;

      const timeText = data.createdAt
       ? new Date(data.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        : "Sending...";

      messagesHTML += `
        <div style="width:100%;display:flex;flex-direction:column;margin-bottom:6px;opacity:${data.createdAt? "1" : "0.5"}">
          ${senderLabel}
          <div class="${data.sender === "Milo AI Bot"? "bot-message" : "message"}">
            ${data.text}
            <small style="display:block;font-size:10px;margin-top:4px;opacity:0.7">${timeText}</small>
          </div>
        </div>
      `;
    });

    chatBox.innerHTML = messagesHTML; // SET MESSAGES
    if(typing) chatBox.appendChild(typing); // THEN PUT TYPING BACK AT END
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}



function getBotReply(message) {
  const text = message.toLowerCase();
  if (text.includes("hello")) { return "Hello 👋"; }
  else if (text.includes("how are you")) { return "I'm doing great 🚀"; }
  else if (text.includes("your name")) { return "I'm Milo AI 🤖"; }
  else if (text.includes("bye")) { return "Goodbye 👋"; }
  else { return "Interesting message 🔥"; }
}

document.getElementById("chat-input").addEventListener("keypress", function(event) {
  if (event.key === "Enter") { sendMessage(); }
});

function startVoice() {
  if (!('webkitSpeechRecognition' in window)) {
    showNotification("Voice recognition not supported");
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();
  recognition.onresult = function(event) {
    const speech = event.results[0][0].transcript;
    document.getElementById("chat-input").value = speech;
    sendMessage();
  };
  recognition.onerror = function() {
    showNotification("Microphone permission denied");
  };
}
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

voiceNoteBtn.addEventListener("click", async () => {

  if (!isRecording) {

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
mediaRecorder.onstop = async () => {

  mediaRecorder.stream.getTracks().forEach(track => track.stop());

  const audioBlob = new Blob(audioChunks, {
    type: "audio/webm"
  });
  if (!selectedUser) {
  showNotification("Select a user first");
  return;
}

const chatId = getPrivateChatId(currentUser, selectedUser);
const audioURL = URL.createObjectURL(audioBlob);

const audio = document.createElement("audio");
audio.controls = true;
audio.src = audioURL;



showNotification("Voice note ready.");
  console.log(audioBlob);

  showNotification("Voice note recorded successfully.");

};
    mediaRecorder.start();

    isRecording = true;
    voiceNoteBtn.innerText = "⏹ Stop Recording";

  } else {

    mediaRecorder.stop();
    
    isRecording = false;
    voiceNoteBtn.innerText = "🎵 Voice Note";

  }

});
function sendImage() {
  const fileInput = document.getElementById("chat-image");
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const chatBox = document.getElementById("chat-box");
      const image = document.createElement("img");
      image.src = e.target.result;
      image.classList.add("chat-image");
      chatBox.appendChild(image);
      chatBox.scrollTop = chatBox.scrollHeight;
    };
    reader.readAsDataURL(file);
  }
}

function addEmoji(emoji) {
  const input = document.getElementById("chat-input");
  chatInput.addEventListener("input", async () => {

  if (!selectedUser) return;

  const chatId = getPrivateChatId(currentUser, selectedUser);

  await setDoc(
    doc(db, "typingStatus", chatId),
    {
      typing: true,
      user: currentUser,
      time: serverTimestamp()
    },
    { merge: true }
  );

});
  input.value += emoji;
  input.focus();
}

window.addEventListener("DOMContentLoaded", function() {
  const savedPhone = localStorage.getItem("phone-number");
  if (savedPhone) {
    currentUser = savedPhone;
    document.getElementById("profile-phone").innerText = "Phone: " + savedPhone;
    document.getElementById("profile-status").innerText = "Online";
    document.getElementById("status-dot").classList.remove("offline-dot");
    document.getElementById("status-dot").classList.add("online-dot");
  }
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    document.getElementById("theme-button").innerText = "☀️ Light Mode";
  }
  updateDashboard();
  
  onSnapshot(collection(db, "users"), () => {
  updateDashboard();
});

onSnapshot(collection(db, "messages"), () => {
  updateDashboard();
});
  loadMessages();
  loadUsers();
  const authPage = document.getElementById("auth-page");
const appPage = document.getElementById("app-page");

if (authPage && appPage) {
    authPage.style.display = "block";
    appPage.style.display = "none";
}
});

window.addEventListener("load", function() {
  setTimeout(() => {
    document.getElementById("loader").style.display = "none";
    document.getElementById("main-content").style.display = "block";
  }, 4000);
});

let currentSlide = 0;
const slider = document.getElementById("slider");
const slides = document.querySelectorAll(".slider img");
function showSlide(index) {
  if (index < 0) { currentSlide = slides.length - 1; }
  else if (index >= slides.length) { currentSlide = 0; }
  else { currentSlide = index; }
  slider.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function moveSlide(direction) { showSlide(currentSlide + direction); }
setInterval(() => { moveSlide(1); }, 4000);

function toggleTheme() {

  document.body.classList.toggle("light-mode");

  const buttons = document.querySelectorAll("#theme-button, #home-theme-button");

  if (document.body.classList.contains("light-mode")) {

    buttons.forEach(button => {
      button.innerText = "☀️ Light Mode";
    });

    localStorage.setItem("theme", "light");

  } else {

    buttons.forEach(button => {
      button.innerText = "🌙 Dark Mode";
    });

    localStorage.setItem("theme", "dark");

  }

}

function createParticles() {
  const particles = document.getElementById("particles");
  for (let i = 0; i < 40; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDuration = (Math.random() * 5 + 5) + "s";
    particle.style.width = particle.style.height = (Math.random() * 10 + 5) + "px";
    particles.appendChild(particle);
  }
}
createParticles();

function openSidebar() { document.getElementById("sidebar").style.left = "0"; }
function closeSidebar() { document.getElementById("sidebar").style.left = "-250px"; }

const chatInput = document.getElementById("chat-input");
const typingSound = document.getElementById("typing-sound");
chatInput.addEventListener("input", function() {
  typingSound.currentTime = 0;
  typingSound.play();
});

function clearChat() {
  document.getElementById("chat-box").innerHTML = "";
  showNotification("Chat Cleared - Only on your screen");
}
function showSection(sectionId) {

  const sections = document.querySelectorAll("#app-page section");

  sections.forEach(section => {

    section.style.display = "none";

  });

  const selectedSection = document.getElementById(sectionId);

  if (selectedSection) {

    selectedSection.style.display = "block";

  }

}

window.addEventListener("load", function () {

  const savedPhone = localStorage.getItem("phone-number");
  const savedPassword = localStorage.getItem("password");

  if (savedPhone && savedPassword) {

    currentUser = savedPhone;

    document.getElementById("auth-page").style.display = "none";

    document.getElementById("app-page").style.display = "block";

    document.getElementById("profile-phone").innerText =
    "Phone: " + savedPhone;

    document.getElementById("profile-status").innerText =
    "Online";

    document.getElementById("status-dot").classList.remove("offline-dot");

    document.getElementById("status-dot").classList.add("online-dot");

    showSection("home-page");

  } else {

    document.getElementById("auth-page").style.display = "block";

    document.getElementById("app-page").style.display = "none";

  }

});
function openPrivateChat(phone) {

  selectedUser = phone;

  const chatId = getPrivateChatId(currentUser, selectedUser);

  const header = document.getElementById("private-chat-header");

  if (header) {
    header.innerText = "Chat with: " + phone;
  }

}
function loadUsers() {

  const usersList = document.getElementById("users-list");

  if (!usersList) return;

  onSnapshot(collection(db, "users"), (snapshot) => {

    usersList.innerHTML = "<h3>Users</h3>";

    snapshot.forEach((doc) => {

      const user = doc.data();

      const userDiv = document.createElement("div");



let dot = user.status === "Online" ? "🟢" : "⚫";

if (!user.phone) return;

userDiv.innerText =
  dot + " " + user.phone;

userDiv.onclick = function() {

  selectedUser = user.phone;

  openPrivateChat(user.phone);

  loadPrivateMessages();

};

usersList.appendChild(userDiv);

      

    });

  });

}


function getPrivateChatId(user1, user2) {

  return [user1, user2]
    .sort()
    .join("_");

}
function loadPrivateMessages() {

  if (!selectedUser) return;

  const chatBox = document.getElementById("chat-box");

  const chatId = getPrivateChatId(currentUser, selectedUser);

  const q = window.query(
    window.collection(
      window.db,
      "privateChats",
      chatId,
      "messages"
    ),
    window.orderBy("createdAt", "asc")
  );

  window.onSnapshot(q, (snapshot) => {

    const typing = document.getElementById("typing-indicator");

    chatBox.innerHTML = "";

    snapshot.forEach((doc) => {

      const data = doc.data();
      if (data.sender !== currentUser && data.status === "delivered") {
  window.updateDoc(
    window.doc(
      window.db,
      "privateChats",
      chatId,
      "messages",
      doc.id
    ),
    {
      status: "seen"
    }
  );
}

      const message = document.createElement("div");

      message.className =
data.sender === currentUser
? "bot-message"
: "message";
      
        
        
        

      let timeText = "Sending...";

      if (data.createdAt) {
        timeText = new Date(
          data.createdAt.toDate()
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });
      }

       let statusText = "";

if (data.sender === currentUser) {

  if (data.status === "sent") {
    statusText = " ✓";
  }

  if (data.status === "delivered") {
    statusText = " ✓✓";
  }

  if (data.status === "seen") {
  statusText = " <span style='color:red'>✓✓ Seen</span>";
}

}

message.innerHTML =
  data.text +
  "<br><small style='font-size:10px;opacity:0.7'>" +
  timeText +
  statusText +
  "</small>";
        
        
        
        
// Mark received messages as delivered
if (data.sender !== currentUser && data.status === "sent") {
  window.updateDoc(
    window.doc(
      window.db,
      "privateChats",
      chatId,
      "messages",
      doc.id
    ),
    {
      status: "delivered"
    }
  );
}
      chatBox.appendChild(message);

    });

    if (typing) {
      chatBox.appendChild(typing);
    }

    chatBox.scrollTop = chatBox.scrollHeight;

  });

}