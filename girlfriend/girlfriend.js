// Firebase 初始化
const firebaseConfig = {
    apiKey: "AIzaSyDn_JnNIbBx-FMAi02puLmxStoTo4XLODo",
    authDomain: "gift-e879d.firebaseapp.com",
    projectId: "gift-e879d",
    storageBucket: "gift-e879d.firebasestorage.app",
    messagingSenderId: "747195743787",
    appId: "1:747195743787:web:e0e41f88384fe9e7bdf46e",
    measurementId: "G-PF9T5NRHQK"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let boyfriendTasks = [];   // 男友任務列表
let punishments = [];      // 懲罰列表
let girlPoints = 1200;     // 女友剩餘點數

// 分頁切換
function showPage(pageId) {
    const pages = ['page-publish', 'page-punishment'];
    pages.forEach(id => document.getElementById(id).style.display = (id === pageId) ? 'block' : 'none');
}
showPage('page-publish');

// 渲染任務下拉
function renderTaskList() {
    const select = document.getElementById("task-list");
    select.innerHTML = "";
    boyfriendTasks.forEach((t, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = t.name;
        select.appendChild(opt);
    });
    updateTaskInfo();
}

// 更新基礎點數和建議時間顯示
function updateTaskInfo() {
    const idx = document.getElementById("task-list").value;
    const task = boyfriendTasks[idx];
    document.getElementById("base-points").textContent = task.basePoints;
    document.getElementById("standard-time").textContent = task.standardTime;
    calculateConsumePoints();
}

// 計算消耗點數
function calculateConsumePoints() {
    const idx = document.getElementById("task-list").value;
    const task = boyfriendTasks[idx];
    let userTime = Number(document.getElementById("time-limit").value);
    if (!userTime || userTime <= 0) userTime = task.standardTime;
    const consume = Math.ceil(task.basePoints * (task.standardTime / userTime));
    document.getElementById("consume-points").textContent = consume;
    return consume;
}

document.getElementById("task-list").addEventListener("change", updateTaskInfo);
document.getElementById("time-limit").addEventListener("input", calculateConsumePoints);

// 發布任務
document.getElementById("publish-btn").addEventListener("click", () => {
    const idx = document.getElementById("task-list").value;
    const task = boyfriendTasks[idx];
    const time = Number(document.getElementById("time-limit").value) || task.standardTime;
    const consume = calculateConsumePoints();
    const reward = document.getElementById("reward").value;

    db.collection("points").doc("girlPointsDoc").get().then(doc => {
        if (doc.exists) girlPoints = doc.data().girlPoints;
        if (consume > girlPoints) { alert("點數不足"); return; }

        girlPoints -= consume;
        db.collection("points").doc("girlPointsDoc").set({ girlPoints });

        db.collection("publishedTasks").add({
            task: task.name,
            time,
            points: consume,
            reward,
            status: "待完成",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById("time-limit").value = "";
        document.getElementById("reward").value = "";
    });
});

// 渲染懲罰列表
function renderPunishments() {
    const container = document.getElementById("punishment-list");
    container.innerHTML = "";
    punishments.forEach((p) => {
        const div = document.createElement("div");
        div.innerHTML = `<p>${p.text}</p><button onclick="deletePunishment('${p.id}')">刪除</button>`;
        container.appendChild(div);
    });
}

// 新增懲罰
document.getElementById("add-punishment").addEventListener("click", () => {
    const val = document.getElementById("new-punishment").value;
    if (val && punishments.length < 20) {
        db.collection("punishments").add({ text: val });
        document.getElementById("new-punishment").value = "";
    } else alert("最多20個懲罰");
});

// 刪除懲罰
function deletePunishment(id) { db.collection("punishments").doc(id).delete(); }

// 監聽男友任務列表
db.collection("tasks").onSnapshot(snapshot => {
    boyfriendTasks = [];
    snapshot.forEach(doc => boyfriendTasks.push({ ...doc.data(), id: doc.id }));
    renderTaskList();
});

// 監聽懲罰列表
db.collection("punishments").onSnapshot(snapshot => {
    punishments = [];
    snapshot.forEach(doc => punishments.push({ ...doc.data(), id: doc.id }));
    renderPunishments();
});

// 監聽女友剩餘點數
db.collection("points").doc("girlPointsDoc").onSnapshot(doc => {
    if (doc.exists) {
        girlPoints = doc.data().girlPoints;
        document.getElementById("girl-points").textContent = girlPoints;
    }
});
