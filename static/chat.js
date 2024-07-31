const matAssistBtn = document.getElementById('mat-assist-btn');
const chatContainer = document.getElementById('chat-container');
const chatHideBtn = document.getElementById('chatHideBtn');

const textarea = document.getElementById('message-input');

matAssistBtn.addEventListener('click', () => {
    chatContainer.classList.toggle('show');
    //matAssistBtn.innerHTML = chatContainer.classList.contains('show') ? "Mat Assist &#x2b07;" : "Mat Assist &#x2b06;";
});

chatHideBtn.addEventListener('click', () => {
    chatContainer.classList.toggle('show');
    //matAssistBtn.innerHTML = chatContainer.classList.contains('show') ? "Mat Assist &#x2b07;" : "Mat Assist &#x2b06;";
});

chatRefreshBtn.addEventListener('click', () => {
    $("#messages").empty();
    var session_id = $('#session_id').text();
    $.getJSON("/refresh",{session_id: session_id }, function (data) {
        if (data.length > 0) {
            var parsedMessage = marked.parse(data);
            $("#messages").append("<div class='response-message'>" + parsedMessage + "</div>");
        }
    });
});

textarea.addEventListener('input', () => {
    textarea.style.height = 'auto'; // Reset height to auto to recalculate scrollHeight
    textarea.style.height = textarea.scrollHeight + 'px'; // Set height to scrollHeight
});

$(document).ready(function () {

    function fetchMessages() {
        $.getJSON("/get_messages", function (data) {
            //$("#messages").empty();
            //data.messages.forEach(function (message) {
            $.getJSON("/get_messages", function (data) {
                if (data.length > 0) {
                    var parsedMessage = marked.parse(data);
                    $("#messages").append("<div class='response-message'>" + parsedMessage + "</div>");
                }
            });
        });

    }

    fetchMessages();
    $("#message-form").submit(function (e) {
        e.preventDefault();
        var session_id = $('#session_id').text();
        var message = $("#message-input").val();
        if (message.trim() !== "") {
            $("#messages").append("<div class='user-message'>" + message + "</div>");
            $("#messages").append("<div class='message response-message blinker'>Waiting for response...</div>");
            $("#message-input").val("");
            $("#message-input").css('height', 'auto');
            scrollToBottom($("#message-input"));
            $.get("/send_message", { message: message, session_id: session_id }, function (data) {
                //fetchMessages();
                // Remove blinker class after receiving response
                $(".blinker").remove();

                if (data.length > 0) {
                    var parsedMessage = marked.parse(data);
                    $("#messages").append("<div class='response-message'>" + parsedMessage + "</div>");
                }
            }).fail(function() {
                $(".blinker").remove();
                $("#messages").append("<div class='response-message-error'> Encounter error. Please considering refresh the page or refresh the chat.</div>");
              })

           
        }
    });
});


// Function to handle cleanup tasks
function cleanupFunction() {
    // Perform any necessary cleanup tasks here
    console.log('Cleanup tasks performed');

    var session_id = $('#session_id').text();
    $.get("/cleanup", { session_id: session_id }, function (data) {
        //cleaned

    });
}

// Add event listeners for beforeunload and unload events
window.addEventListener('beforeunload', function (event) {
    // Call cleanupFunction before the page is unloaded
    cleanupFunction();

});

window.addEventListener('unload', function (event) {
    // Call cleanupFunction when the page is unloaded
    cleanupFunction();
});