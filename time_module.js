
function getDate() {
    const date_ob = new Date();
    var year = date_ob.getFullYear();
    if (date_ob.getMonth() < 10) {
        var month = "0" + date_ob.getMonth();
    } else {
        var month = date_ob.getMonth();
    }

    if (date_ob.getDay() < 10) {
        var day = "0" + date_ob.getDay();
    } else {
        var getDay = date_ob.getDay();
    }

    return year + "-" + month + "-" + day
}

module.exports = {getDate};
