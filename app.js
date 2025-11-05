// Firebase設定
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ↓↓↓ここに自分のFirebase設定を入れる↓↓↓
const firebaseConfig = {
  apiKey: "AIzaSyAhzyGSVtxvd3DeReR13iVybxAbx8W8vrg",
  authDomain: "point-3d4a0.firebaseapp.com",
  projectId: "point-3d4a0",
  storageBucket: "point-3d4a0.firebasestorage.app",
  messagingSenderId: "xxxx",
  appId: "xxxx"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== ユーザー操作 =====

// ログイン
window.login = async function() {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('password').value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    location.href = "card.html";
  } catch (e) {
    alert("ログイン失敗: " + e.message);
  }
}

// 新規登録
window.signup = async function() {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('password').value;
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, "users", userCred.user.uid), {
      points: 0,
      history: []
    });
    alert("登録完了！ログインしてください。");
  } catch (e) {
    alert("登録失敗: " + e.message);
  }
}

// ===== 会員ページ =====
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  if (location.pathname.endsWith("card.html")) {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.data();

    document.getElementById("points").innerText = `ポイント：${data.points} pt`;
    JsBarcode("#barcode", user.uid.slice(0, 10), { format: "CODE128", width: 2, height: 80 });

    window.showHistory = () => {
      const list = document.getElementById("history");
      list.innerHTML = "";
      data.history?.forEach(h => {
        const li = document.createElement("li");
        li.textContent = `${h.date}：${h.action}`;
        list.appendChild(li);
      });
    };
  }
});

// ログアウト
window.logout = async function() {
  await signOut(auth);
  location.href = "index.html";
}

// ===== 管理者ページ =====
if (location.pathname.endsWith("admin.html")) {
  let scannedUserId = null;

  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      scannedUserId = decodedText;
      document.getElementById("scannedId").innerText = "読み取りID: " + scannedUserId;
      html5QrCode.stop();
    }
  );

  window.addPoints = async function() {
    if (!scannedUserId) return alert("バーコードを読み取ってください。");
    const add = parseInt(document.getElementById("addPoint").value);
    const ref = doc(db, "users", scannedUserId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return alert("ユーザーが見つかりません。");
    const newPoints = snap.data().points + add;

    await updateDoc(ref, {
      points: newPoints,
      history: arrayUnion({
        date: new Date().toLocaleString(),
        action: `+${add}ポイント加算（お店）`
      })
    });
    document.getElementById("result").innerText = "加算完了！現在：" + newPoints + " pt";
  };
}
