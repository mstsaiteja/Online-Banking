let logger = null;
let msg = null; 

function get_logger(){
    return logger;
}

function get_msg(){
    return msg;
}

function set_logger(new_logger){
    logger = new_logger;
}

function set_msg(new_msg){
    msg = new_msg;
}

module.exports = { get_logger, get_msg, set_logger, set_msg };
