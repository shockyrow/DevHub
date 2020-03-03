let tasks = [];
let currentTask = null;
let currentTaskId = 0;
let resultForm = $("#resultForm");

function testCode(code, tests) {
    for (let testId in tests) {
        let inputs = tests[testId].inputs;
        let outputs = tests[testId].outputs;

        eval(code);

        if (typeof result !== 'undefined' && JSON.stringify(result) === JSON.stringify(outputs)) {
            continue;
        } else {
            return parseInt(testId) + 1;
        }
    }

    return -1;
}

resultForm.submit((e) => {
    e.preventDefault();

    let code = $("#code").val();
    let status = $("#status");
    let failed = false;

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
        }

        tasks[currentTaskId].lastAnswer = code;
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
            }

            tasks[currentTaskId].lastAnswer = code;
        } else {
            let statusMsg = `Passed`;

            status.addClass("text-success");
            status.removeClass("text-danger");
            status.text(statusMsg);

            tasks[currentTaskId].status = "passed";
            tasks[currentTaskId].statusMsg = statusMsg;
            tasks[currentTaskId].lastAnswer = code;
            tasks[currentTaskId].lastCorrectAnswer = code;
        }
    }
});

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

    // $("#title").text(`${id + 1}. ${currentTask.title}`);
    $("#description").text(currentTask.description);
    $("#pretests").html("");
    $("#code").val(currentTask.lastCorrectAnswer);
    $("#status").text(currentTask.statusMsg);
    $("#status").removeClass("text-danger text-success text-primary font-weight-bold");
    if (currentTask.status == "passed") {
        $("#status").addClass("text-success font-weight-bold");
    } else if (currentTask.status == "failed") {
        $("#status").addClass("text-danger font-weight-bold");
    }
    
    currentTask.pretests.forEach(pretest => {
        $("#pretests").append(`
        <tr>
            <td>${JSON.stringify(pretest.inputs)}</td>
            <td>${JSON.stringify(pretest.outputs)}</td>
        </tr>
        `);
    });
}

fetch("data/tasks.json")
    .then(response => response.json())
    .then(json => {
        tasks = json;
        
        showTask();

        $("#tasks").html("");

        tasks.forEach((task, index) => {
            $("#tasks").append(`<option value="${index}">${index + 1}. ${task.title}${task.status == "passed"? " (OK)" : ""}</option>`);
            $("#tasksList").append(`<div class="col m-0 p-1"><button class="btn btn-block ${task.status == "none" ? "btn-light border" : (task.status == "passed" ? "btn-success" : "btn-outline-danger")}" onclick="showTask(${index})">${index + 1}</button></div>`);
        });
    })
;

$("#prevTask").click(prevTask);
$("#nextTask").click(nextTask);
$("#download").click(() => objectToFile(tasks, "tasks.json"));
$("#tasks").change(function() {
    let taskId = $(this).val();
    showTask(taskId);
    $("#taskInput").val("");
});

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
