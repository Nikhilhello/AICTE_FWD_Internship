// Select DOM elements
const taskForm = document.getElementById("taskForm");
const taskNameInput = document.getElementById("taskName");
const taskSubjectInput = document.getElementById("taskSubject");
const taskDeadlineInput = document.getElementById("taskDeadline");
const taskContainer = document.getElementById("taskContainer");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

const sortSelect = document.createElement("select");
sortSelect.innerHTML = `
  <option value="default">Sort By</option>
  <option value="deadline">Deadline</option>
  <option value="subject">Subject</option>
`;
document.querySelector(".task-list").insertBefore(sortSelect, taskContainer);

// Load tasks from local storage on startup
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
renderTasks();

// === add task =========
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const task = {
    id: Date.now(),
    name: taskNameInput.value,
    subject: taskSubjectInput.value,
    deadline: taskDeadlineInput.value,
    completed: false,
  };

  tasks.push(task);
  saveTasks();
  renderTasks();
  taskForm.reset();
});

// == Render Tasks ====
function renderTasks() {
  taskContainer.innerHTML = "";

  if (tasks.length === 0) {
    taskContainer.innerHTML = "<p>No tasks added yet.</p>";
    updateProgress();
    return;
  }
  // Sorting logic
  let sortedTasks = [...tasks];
  if (sortSelect.value === "deadline") {
    sortedTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  } else if (sortSelect.value === "subject") {
    sortedTasks.sort((a, b) => a.subject.localeCompare(b.subject));
  }

  sortedTasks.forEach((task) => {
    const li = document.createElement("li");
    // Overdue highlight
    const today = new Date().toISOString().split("T")[0];
    let overdue = task.deadline < today && !task.completed;

    li.className = `
      ${task.completed ? "completed" : ""}
      ${overdue ? "overdue" : ""}
    `;

    li.innerHTML = `
      <div>
        <strong>${task.name}</strong> - ${task.subject}
        <br><small>📅 Deadline: ${task.deadline}</small>
      </div>
      <div>
        <button class="complete-btn" onclick="toggleComplete(${task.id})">
          ${task.completed ? "Undo" : "Complete"}
        </button>
        <button class="edit-btn" onclick="editTask(${task.id})">Edit</button>
        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;

    taskContainer.appendChild(li);
  });

  updateProgress();
  renderTimeline();
}

// -----------------Toggle Complete -------------
function toggleComplete(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

// ==== delete task======
function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

// === Edit Task ==
function editTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  // Prefill form with task data
  taskNameInput.value = task.name;
  taskSubjectInput.value = task.subject;
  taskDeadlineInput.value = task.deadline;
  // Remove old version
  deleteTask(id);
}

// ======= Update Progress ======
function updateProgress() {
  if (tasks.length === 0) {
    progressFill.style.width = "0%";
    progressText.textContent = "0% Completed";
    return;
  }

  const completedTasks = tasks.filter((task) => task.completed).length;
  const percent = Math.round((completedTasks / tasks.length) * 100);

  progressFill.style.width = percent + "%";
  progressText.textContent = `${percent}% Completed`;
}

// -+-+-+-+-+-+-+- Save to Local Storage -+-+-+-+-+-+-+-+-+-+
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ==+-+-+== Timeline Visualization =-+-+-+-+-+-+-+-+=====
function renderTimeline() {
  let timeline = document.getElementById("timeline");
  if (!timeline) {
    timeline = document.createElement("div");
    timeline.id = "timeline";
    document.querySelector(".progress-tracker").appendChild(timeline);
  }
  timeline.innerHTML = "<h3>📅 Your Study Plan</h3>";

  if (tasks.length === 0) {
    timeline.innerHTML += "<p>No deadlines yet.</p>";
    return;
  }

  let sorted = [...tasks].sort(
    (a, b) => new Date(a.deadline) - new Date(b.deadline)
  );

  sorted.forEach((task) => {
    const div = document.createElement("div");
    div.className = "timeline-item";
    div.innerHTML = `
      <span>${task.deadline}</span> → <strong>${task.name}</strong> (${task.subject})
      ${task.completed ? "✅" : ""}
    `;
    timeline.appendChild(div);
  });
}

// ==== Sort Handler -++++++++++++++=
sortSelect.addEventListener("change", renderTasks);



// ==== Dark Mode Toggle =-+-+-+-+-+-++++---------==
const darkModeBtn = document.createElement("button");
darkModeBtn.textContent = "🌙 Dark Mode";
darkModeBtn.className = "dark-toggle";
document.querySelector("header").appendChild(darkModeBtn);

darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  darkModeBtn.textContent = 
    document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// ==-++-+++++++++++++ Daily Reminder =+++++++++++++----==
function checkReminders() {
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((task) => task.deadline === today && !task.completed);

  if (todayTasks.length > 0) {
    alert(
      `📅 Reminder: You have ${todayTasks.length} task(s) due today!\n- ` +
      todayTasks.map((t) => t.name + " (" + t.subject + ")").join("\n- ")
    );
  }
}

// Run reminder check on page load
checkReminders();


// =-++++++= STREAK TRACKER =weekly-++-+=       correct
const streakGrid = document.getElementById("streakGrid");
const streakSection = document.querySelector(".streak-section");

// Get today's date
const today = new Date();
const todayDate = today.toISOString().split("T")[0]; // yyyy-mm-dd
const todayDay = today.getDay(); // 0=Sunday, 6=Saturday

// Load streak data from localStorage
let streakData = JSON.parse(localStorage.getItem("streakData")) || {};

// Mark today as visited if not already
if (!streakData[todayDate]) {
  streakData[todayDate] = true;
  localStorage.setItem("streakData", JSON.stringify(streakData));
}

// Calculate Streak Count (consecutive days)
function getStreakCount() {
  let count = 0;
  let d = new Date(today);

  while (true) {
    const dateStr = d.toISOString().split("T")[0];
    if (streakData[dateStr]) {
      count++;
      d.setDate(d.getDate() - 1); // go back one day
    } else {
      break;
    }
  }
  return count;
}

// Render streak grid (7-day view)
function renderStreak() {
  streakGrid.innerHTML = "";

  // Show streak count above grid
  let streakCount = getStreakCount();
  let streakCounter = document.getElementById("streakCounter");
  if (!streakCounter) {
    streakCounter = document.createElement("p");
    streakCounter.id = "streakCounter";
    streakCounter.style.fontWeight = "bold";
    streakCounter.style.marginBottom = "12px";
    streakSection.insertBefore(streakCounter, streakGrid);
  }
  streakCounter.textContent = `Current Streak: ${streakCount} day${streakCount !== 1 ? "s" : ""}`;

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const currentWeek = [];

  // Build current week (aligned Sun–Sat)
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (todayDay - i));
    currentWeek.push(d.toISOString().split("T")[0]);
  }

  currentWeek.forEach((date, i) => {
    const div = document.createElement("div");
    div.classList.add("streak-day");

    // Label with weekday
    div.textContent = weekDays[i];

    // Today
    if (date === todayDate) {
      div.classList.add("today");
    }

    // Active streak days
    if (streakData[date]) {
      div.classList.add("active");
    }

    streakGrid.appendChild(div);
  });
}

renderStreak();
// -----------+++++++++-------end of correct

// // ========== STREAK TRACKER WITH full MONTH NAVIGATION ==========

// const streakGrid = document.getElementById("streakGrid");
// const streakSection = document.querySelector(".streak-section");
// const streakCounter = document.getElementById("streakCounter");

// let streakData = JSON.parse(localStorage.getItem("streakData")) || {};

// // Track the currently displayed month
// let currentDate = new Date();

// // Mark today as visited if not already
// const today = new Date();
// const todayDate = today.toISOString().split("T")[0];
// if (!streakData[todayDate]) {
//   streakData[todayDate] = true;
//   localStorage.setItem("streakData", JSON.stringify(streakData));
// }

// // Calculate current streak (consecutive days up to today)
// function getStreakCount() {
//   let count = 0;
//   let d = new Date(today);

//   while (true) {
//     const dateStr = d.toISOString().split("T")[0];
//     if (streakData[dateStr]) {
//       count++;
//       d.setDate(d.getDate() - 1);
//     } else {
//       break;
//     }
//   }
//   return count;
// }

// // Render the streak calendar for the current month
// function renderStreak() {
//   streakGrid.innerHTML = "";

//   // Show streak count
//   const streakCount = getStreakCount();
//   if (streakCounter) {
//     streakCounter.textContent = `Current Streak: ${streakCount} day${streakCount !== 1 ? "s" : ""}`;
//   }

//   // Add month navigation
//   const navDiv = document.createElement("div");
//   navDiv.classList.add("month-nav");

//   const prevBtn = document.createElement("button");
//   prevBtn.textContent = "⬅️ Previous Month";
//   prevBtn.onclick = () => changeMonth(-1);

//   const nextBtn = document.createElement("button");
//   nextBtn.textContent = "Next Month ➡️";
//   nextBtn.onclick = () => changeMonth(1);

//   const monthLabel = document.createElement("span");
//   monthLabel.textContent = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

//   navDiv.appendChild(prevBtn);
//   navDiv.appendChild(monthLabel);
//   navDiv.appendChild(nextBtn);
//   streakGrid.appendChild(navDiv);

//   // Add weekday headers
//   const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
//   weekDays.forEach(day => {
//     const div = document.createElement("div");
//     div.classList.add("streak-header-day");
//     div.textContent = day;
//     streakGrid.appendChild(div);
//   });

//   // Get first day of the month and total days
//   const year = currentDate.getFullYear();
//   const month = currentDate.getMonth();
//   const firstDayOfMonth = new Date(year, month, 1).getDay();
//   const daysInMonth = new Date(year, month + 1, 0).getDate();

//   // Add empty slots before first day
//   for (let i = 0; i < firstDayOfMonth; i++) {
//     streakGrid.appendChild(document.createElement("div"));
//   }

//   // Render all days of the month
//   for (let i = 1; i <= daysInMonth; i++) {
//     const d = new Date(year, month, i);
//     const dateStr = d.toISOString().split("T")[0];
//     const div = document.createElement("div");
//     div.classList.add("streak-day");
//     div.textContent = i;

//     if (dateStr === todayDate) div.classList.add("today");
//     if (streakData[dateStr]) div.classList.add("active");

//     streakGrid.appendChild(div);
//   }
// }

// // Change the currently displayed month
// function changeMonth(offset) {
//   currentDate.setMonth(currentDate.getMonth() + offset);
//   renderStreak();
// }
// // Initial render
// renderStreak();
// // =-++-+-+----------+= END STREAK TRACKER =++++++++++++-------== 

//about section js  start 
const aboutButton = document.getElementById("aboutButton");
const aboutPanel = document.getElementById("aboutPanel");
const closeAbout = document.getElementById("closeAbout");
const overlay = document.getElementById("overlay");
// Open panel
aboutButton.addEventListener("click", () => {
  aboutPanel.classList.add("active");
  overlay.classList.add("active");
});
// Close panel
function closePanel() {
  aboutPanel.classList.remove("active");
  overlay.classList.remove("active");
}
closeAbout.addEventListener("click", closePanel);
overlay.addEventListener("click", closePanel);
// about section end