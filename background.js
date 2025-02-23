if (jQuery) {  
    console.log("jQuery loaded");
} else {
    // jQuery not loaded
    console.log("jQuery not loaded");
}
if (moment) {  
    console.log("Moment loaded");
} else {
    // jQuery not loaded
    console.log("Moment not loaded");
}
var fetching_notif = false;
chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({color: '#3aa757'}, function() {
      console.log('The color is green.');
    });
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostEquals: 'developer.chrome.com'},
        })
        ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
    });
});

var all_notifications = {};
var used_notifications = {};
var placed_orders = [];
var notificationsUsed = {};
var notificationOrdersSet = {};
function fetch_notifications(url,requestHeaders){
    fetching_notif = true;
    var params = {
        // 'deployment_uuid':dep_id,
    };
    reqHeaders = {}
    for(var i=0;i<requestHeaders.length;++i){
        reqHeaders[requestHeaders[i]["name"]]=requestHeaders[i]["value"]
    }
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": url,
        "method": "GET",
        "headers": {
        },
        "data":params,
        "timeout": 60000,//40 sec timeout
        "headers": reqHeaders,
        };
    $.ajax(settings).done(function (msg){
        
        console.log(msg);
        notificationsDict = msg['results'];
        notif_dep_list = [];
        notification_dict = {};
        try{
            if (msg["status"]=="error" || msg["results"]==undefined){
                return 1;
            }
        }catch(err){
           
        }

        try{
            notif_dep_list = notificationsDict.notif_dep_list;
        }catch(err){
            notif_dep_list = [];
        }

        try{
            notification_dict = notificationsDict.notification_dict;
        }catch(err){
            notification_dict = {};
        }

        for(var i=0; i<notif_dep_list.length;i++){
            dep_notif = notif_dep_list[i];
            notif_dep_id = dep_notif[0];
            // console.log("9999999999",moment(notification_dict[notif_dep_id]['notification_time']));
            dep_notif_time = moment(notification_dict[notif_dep_id]['notification_time']).valueOf()/1000;
            dep_algo_name = notification_dict[notif_dep_id]['algo_name'];
            dep_algo_id = notification_dict[notif_dep_id]['algo_uuid'];
            dep_notifs = notification_dict[notif_dep_id]['notifications'];
            if (all_notifications[notif_dep_id]!=undefined){
                // console.log("11111notif_dep_id",notif_dep_id);
                if ((all_notifications[notif_dep_id].length!=dep_notifs.length)|| 1==1)
                {
                    all_notifications[notif_dep_id]=dep_notifs;
                    latest_notif = all_notifications[notif_dep_id][0];
                    // if (moment()-dep_notif_time<60000*5 && notificationsUsed[dep_notif['notification_uuid']]==undefined){
                        // console.log("22222 notif_dep_id",dep_notif,moment().valueOf()/1000,dep_notif_time);
                    if (moment().valueOf()/1000-dep_notif_time<60000*5 && notificationsUsed[latest_notif['notification_uuid']]==undefined && (notificationOrdersSet[latest_notif['notification_uuid']]==undefined||notificationOrdersSet[latest_notif['notification_uuid']]==0)){
                        // console.log("33333 notif_dep_id",dep_notif);
                        if(latest_notif['notification-type']=="order-notification" || latest_notif['notification-type']=="discipline-notif" || latest_notif['notification-type']=="cancel-discipline-notif" || latest_notif['price_trigger-notification']!=undefined)
                        {
                            if (latest_notif["alert_type"]=="notification_alert"){
                                generate_order(latest_notif,reqHeaders)
                            }
                        }
                    }
                }
            }else{
                all_notifications[notif_dep_id]=dep_notifs;
                latest_notif = all_notifications[notif_dep_id][0];
                // console.log("4444444444notif_dep_id",notif_dep_id,latest_notif,notificationsUsed[latest_notif['notification_uuid']],moment().valueOf()/1000,dep_notif_time);
                if (moment().valueOf()/1000-dep_notif_time<60000*5 && notificationsUsed[latest_notif['notification_uuid']]==undefined){
                    // if (moment()-dep_notif_time<60000*5 && notificationsUsed[dep_notif['notification_uuid']]==undefined){
                    if(latest_notif['notification-type']=="order-notification" || latest_notif['notification-type']=="discipline-notif" || latest_notif['notification-type']=="cancel-discipline-notif" || latest_notif['price_trigger-notification']!=undefined)
                    {
                        if ((latest_notif["alert_type"]=="notification_alert") && (notificationOrdersSet[latest_notif['notification_uuid']]==undefined||notificationOrdersSet[latest_notif['notification_uuid']]==0)){
                            generate_order(latest_notif,reqHeaders)
                        }
                    }
                }
            }
        }
        fetching_notif = false;
    }).always(function(){
        fetching_notif = false;
    });
}

function generate_order(notification,reqHeaders){
    transaction_type = notification["transaction_type"];
    segment = notification["seg"];
    if (transaction_type==undefined){
        transaction_type = notification["action_type"];
    }
    if (segment==undefined||segment==""){
        segment = notification["segment"]
    }
    symbol = notification["sym"];
    if (symbol==undefined||symbol==""){
        symbol = notification["symbol"]
    }
    quantity = parseInt(notification["quantity"]);
    product = notification["product"];
    tpsl_type = notification["tpsl_type"]
    trigger_price = notification["trigger_price"];
    variety = notification["variety"];
    order_type = notification["order_type"];
    tp = notification['stop_loss'];
    sl = notification['target_profit']

    if (order_type==undefined||order_type==""){
        order_type = "MARKET";
    }
    
    if(notification['seg']=='CDS-FUT'){
        trigger_price =parseFloat(trigger_price).toFixed(4);
        exchange = 'CDS'
    }
    else{
        trigger_price =parseFloat(trigger_price).toFixed(2);
    }
    validity = notification["validity"]
    if (validity==undefined){
        validity = "DAY"
    }
    deployment_uuid = notification["deployment_uuid"];
    algo_uuid = notification["algo_uuid"];
    algo_name = notification["algo_name"];

    trailing_stoploss = notification["trailing_stoploss"];

    tpsl_key = notification["price_trigger-notification"];
    exchange = segment;
    if(notification['seg']=='CDS-FUT'){
        exchange = 'CDS'
    }
    else if(notification['seg']=='NFO-FUT'){
        exchange = 'NFO'
    }
    console.log('zzzzzzzzzzzzz',exchange,segment,notification['seg'])
    var order_obj = {
                "deployment_uuid":deployment_uuid,
                "notification_uuid":notification["notification_uuid"],
                "algo_uuid":algo_uuid,
                "algo_name":algo_name,
                "exch":exchange,
                "transaction_type":transaction_type,
                "segment":segment,
                "quantity":quantity,
                "product":product,
                "seg":segment,
                "sym":symbol,
                "symbol":symbol,
                "order_type":order_type,
                "quantity":quantity,
                "product":product,
                "validity":validity,
                "variety":variety,
                }
    if (order_type=="LIMIT")
    {  
        order_obj["price"]=trigger_price
    }
    if (variety.toLocaleLowerCase()=="bo"){
        if(tpsl_type!='pct')
        { 
            squareoff_val = parseFloat(tp).toFixed(2);
            stoploss_val = parseFloat(sl).toFixed(2);
            trailing_stoploss = '0';
        }
        else{
            squareoff_val = parseFloat(parseFloat(trigger_price)*parseFloat(tp)/100).toFixed(2);
            stoploss_val = parseFloat(parseFloat(trigger_price)*parseFloat(sl)/100).toFixed(2);
            trailing_stoploss = '0';
        }
        order_obj['variety']=variety.toLocaleLowerCase();
        order_obj['squareoff']=squareoff_val
        order_obj['stoploss']=stoploss_val
        order_obj["price"]=trigger_price
        order_obj["order_type"]="LIMIT"
        if(trailing_stoploss!=undefined){
            order_obj['trailing_stoploss']=trailing_stoploss
        }else{
            order_obj['trailing_stoploss']=0
        }
    }
    if(tpsl_key!=undefined && tpsl_key!=""){
        console.log("tpsl order placed",order_obj);
        order_obj['tpsl_key']=tpsl_key
        order_obj['token']=tpsl_key.split(':')[3];
        place_order_tpsl(order_obj,reqHeaders);
        notificationOrdersSet[notification["notification_uuid"]]=1

    }else{
        console.log("direct order placed",order_obj);
        place_order(order_obj,reqHeaders);
        notificationOrdersSet[notification["notification_uuid"]]=1
    }
}

function place_order(order_obj,reqHeaders){
    var params = order_obj;
    auth = reqHeaders["authorization"];
    if (auth == undefined){
        auth = reqHeaders["Authorization"];
    }
    j = auth.split(";");
    csrfmiddlewaretoken = ''
    for (var i=0;i<j.length;i++){
        if (j[i].includes("csrfmiddlewaretoken")){
            sp = j[i].split("=")
            csrfmiddlewaretoken = sp[1];
        }
    }
    reqHeaders["referer"]="https://www.streak.tech";
    params["csrfmiddlewaretoken"]=csrfmiddlewaretoken;
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://api-op.streak.tech/place_order/",
        "method": "POST",
        "data":params,
        "timeout": 60000,//40 sec timeout
        "headers": reqHeaders,
        };
    $.ajax(settings).done(function (msg){
        console.log(msg)
    });
}

function place_order_tpsl(ob,reqHeaders){
    var params = ob;
    auth = reqHeaders["authorization"];
    if (auth == undefined){
        auth = reqHeaders["Authorization"];
    }
    j = auth.split(";");
    csrfmiddlewaretoken = '';
    for (var i=0;i<j.length;i++){
        if (j[i].includes("csrfmiddlewaretoken")){
            sp = j[i].split("=");
            csrfmiddlewaretoken = sp[1];
        }
    }
    params["csrfmiddlewaretoken"]=csrfmiddlewaretoken;
    reqHeaders["referer"]="https://www.streak.tech";
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://api-op.streak.tech/place_order_tpsl/",
        "method": "POST",
        "data":params,
        "timeout": 60000,//40 sec timeout
        "headers": reqHeaders,
        };
    $.ajax(settings).done(function (msg){
        console.log(msg)
    });
}

chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) { 
        // return {cancel: true}; 
    if(details.url=="https://api-op.streak.tech/notifications_handler/"
         || details.url=="https://api-op.streak.tech/fetch_order_log/?status=0&limit=100&page=0"){
            console.log("onBeforeRequest",details,details.requestHeaders,details.initiator)
            // for (var i = 0; i < details.requestHeaders.length; ++i) {
            //     if (details.requestHeaders[i].name === 'User-Agent') {
            //         console.log(details.requestHeaders.splice(i, 1));
            //     }
            // }
            // console.log(details.requestHeaders);
            if ((details.initiator=="https://streakv3.zerodha.com"
                    ||details.initiator=="https://streak.zerodha.com" 
                    || details.initiator.includes(".streak.tech") 
                    || details.initiator.includes("https://www.streak.tech")
                ) && fetching_notif!=true){
                try{
                    notif_url = "https://api-op.streak.tech/notifications_handler/"
                    fetch_notifications(notif_url,details.requestHeaders);
                }catch(err) {
                }
            }
        }
    },
    {urls: ["<all_urls>"]},
    ["requestHeaders"]
);
    
chrome.webRequest.onCompleted.addListener(
    function(details){
        if(details.url=="https://api-op.streak.tech/notifications_handler/"){
            console.log("OnCompleted",details,details.requestHeaders)
        }
    },
    {urls: ["<all_urls>"]},
    ["responseHeaders"]
)
// chrome.webRequest.onBeforeSendHeaders.addListener(
//     function(details) {
//         for (var i = 0; i < details.requestHeaders.length; ++i) {
//         if (details.requestHeaders[i].name === 'User-Agent') {
//             details.requestHeaders.splice(i, 1);
//             break;
//         }
//         }
//         return {requestHeaders: details.requestHeaders};
//     },
//     {urls: ["<all_urls>"]},
//     ["blocking", "requestHeaders"]);

function createWebSocketConnection() {
    if('WebSocket' in window){
        chrome.storage.local.get("instance", function(data) {
            console.log("connecting to"+ data.instance)
            connect('wss://' + data.instance + '/ws/demoPushNotifications');
        });
    }
}

//Make a websocket connection with the server.
function connect(host) {
    if (websocket === undefined) {
        websocket = new WebSocket(host);
    }

    websocket.onopen = function() {
        chrome.storage.local.get(["username"], function(data) {
            websocket.send(JSON.stringify({userLoginId: data.username}));
        });
    };

    websocket.onmessage = function (event) {
        var received_msg = JSON.parse(event.data);
        var demoNotificationOptions = {
            type: "basic",
            title: received_msg.subject,
            message: received_msg.message,
            iconUrl: "images/demo-icon.png"
        }
        chrome.notifications.create("", demoNotificationOptions);
        updateToolbarBadge();
    };

    //If the websocket is closed but the session is still active, create new connection again
    websocket.onclose = function() {
        websocket = undefined;
        chrome.storage.local.get(['demo_session'], function(data) {
            if (data.demo_session) {
                createWebSocketConnection();
            }
        });
    };
}

//Close the websocket connection
function closeWebSocketConnection(username) {
    if (websocket != null || websocket != undefined) {
        websocket.close();
        websocket = undefined;
    }
}

const networkFilters = {
    urls: [
        "wss://*.streak.tech/*"
    ]
};
// chrome.webRequest.onBeforeRequest.addListener((details) => {
//     const { tabId, requestId } = details;
//     // do stuff here
//     console.log("aaaaaaaaaaaaaaaaaaa")
//     console.log(details)
// }, networkFilters);