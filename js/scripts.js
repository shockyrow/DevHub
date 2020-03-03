let tasks = [];
let currentTask = null;
let currentTaskId = 0;
let resultForm = $("#resultForm");

function testCode(code, tests) {
    for (let testId in tests) {
        let input = tests[testId].input;
        let expectedOutput = tests[testId].output;

        try {
            eval(code);
        } catch(err) {
            console.log(err.message);
        }

        if (typeof output !== 'undefined' && JSON.stringify(output) === JSON.stringify(expectedOutput)) {
            continue;
        } else {
            return parseInt(testId) + 1;
        }
    }

    return -1;
}

function prevTask() {
    currentTaskId--;
    showTask((currentTaskId + tasks.length) % tasks.length);
    $("#tasks").val(currentTaskId);
}

function nextTask() {
    currentTaskId++;
    showTask(currentTaskId % tasks.length);
    $("#tasks").val(currentTaskId);
}

function showTask(id = 0) {
    id = parseInt(id);
    currentTaskId = id;
    currentTask = tasks[id];

    $("#tasks").val(id);
    $("#description").text(currentTask.description);
    $("#pretests").html("");
    $("#code").val(currentTask.code);
    $("#status").text(currentTask.statusMsg === "" ? "Not sent" : currentTask.statusMsg);
    $("#status").removeClass("text-danger text-success text-primary font-weight-bold");
    
    if (currentTask.status == "passed") {
        $("#status").addClass("text-success font-weight-bold");
    } else if (currentTask.status == "failed") {
        $("#status").addClass("text-danger font-weight-bold");
    }
    
    currentTask.pretests.forEach(pretest => {
        $("#pretests").append(`
            <tr>
                <td>${JSON.stringify(pretest.input)}</td>
                <td>${JSON.stringify(pretest.output)}</td>
            </tr>
        `);
    });
}

function objectToFile(object, fileName = "data.json", mimeType = "application/json") {
    let url = URL.createObjectURL(new File([JSON.stringify(object)], {type: mimeType}));
    let tasksFileLink = document.createElement("a");

    tasksFileLink.href = url;
    tasksFileLink.download = fileName;

    document.body.appendChild(tasksFileLink);
    tasksFileLink.click();
    document.body.removeChild(tasksFileLink);
}

function objectToLocalStorage(key, object) {
    localStorage.setItem(key, JSON.stringify(object));
}

function objectFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key));
}

function loadData() {
    currentTaskId = (currentTaskId + tasks.length) % tasks.length;
    showTask(currentTaskId);

    $("#tasks").html("");
    $("#tasksList").html("");

    tasks.forEach((task, index) => {
        $("#tasks").append(`<option value="${index}">${index + 1}. ${task.title}${task.status == "passed"? " (OK)" : ""}</option>`);
        $("#tasksList").append(`<div class="col m-0 p-1"><button class="btn btn-block ${task.status === "" ? "btn-light border" : (task.status == "passed" ? "btn-success" : "btn-outline-danger")}" onclick="showTask(${index})">${index + 1}</button></div>`);
    });

    $("#tasks").val(currentTaskId);
}

resultForm.submit((e) => {
    e.preventDefault();

    let code = $("#code").val();
    let status = $("#status");
    let testResult = testCode(code, currentTask.pretests);

    status.addClass("font-weight-bold text-primary");
    status.text("Testing");

    if (testResult > -1) {
        let statusMsg = `Pretest ${testResult} failed`;

        status.addClass("text-danger");
        status.removeClass("text-success text-primary");
        status.text(statusMsg);

        if (tasks[currentTaskId].status != "passed") {
            tasks[currentTaskId].status = "failed";
            tasks[currentTaskId].statusMsg = statusMsg;
            tasks[currentTaskId].code = code;
        }
    } else {
        testResult = testCode(code, currentTask.tests);

        if (testResult > -1) {
            let statusMsg = `Test ${testResult} failed`;

            status.addClass("text-danger");
            status.removeClass("text-success");
            status.text(statusMsg);

            if (tasks[currentTaskId].status != "passed") {
                tasks[currentTaskId].status = "failed";
                tasks[currentTaskId].statusMsg = statusMsg;
                tasks[currentTaskId].code = code;
            }
        } else {
            let statusMsg = `Passed`;

            status.addClass("text-success");
            status.removeClass("text-danger");
            status.text(statusMsg);

            tasks[currentTaskId].status = "passed";
            tasks[currentTaskId].statusMsg = statusMsg;
            tasks[currentTaskId].code = code;
        }
    }

    loadData();
});

fetch("data/tasks.json")
    .then(response => response.json())
    .then(json => {
        tasks = json;
        loadData();
    })
;

$("#prevTask").click(prevTask);
$("#nextTask").click(nextTask);
$("#export").click(() => objectToFile(tasks, "tasks.json"));
$("#import").click(() => $("#db").click());
$("#db").change(function() {
    let reader = new FileReader();
    reader.readAsText(this.files[0], "UTF-8");
    reader.onload = (e) => {
        try {
            tasks = JSON.parse(e.target.result);
            loadData();
        } catch(err) {
            // Error
        }
    };
});
$("#tasks").change(function() {
    let taskId = $(this).val();
    showTask(taskId);
    $("#taskInput").val("");
});
