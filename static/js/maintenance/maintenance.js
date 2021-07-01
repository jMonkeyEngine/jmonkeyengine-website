const JmeMaintenance = {};

JmeMaintenance.Icons = {
    cog: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAABuklEQVRYhe3Wu2sUURQG8J/GTlPETtKIiEnto0gna5Mqq4UKakBBhPTRf0awsTVgYWFjYqdg7JPSEBCbxEcjuNm1mDtkd/bOnc3NWrkfnGLO6/tm7pwzwwQT5KGFDnrBOrie0+hkpoBrmOq7nsKVfyXgCTZwqc83F8mbr8Q38DBHVD+eOnzMP3Abd7Hb5y9tJ8Qe4GfwdbGSS/4oNKgSHdW6QdiR8W4M5KWt5Qi4gL0xkH/DbI4AuDUGAYspgqYpOF3j30Ib08FuYrsm92yK4ETEt4irirFq4VyEfAHfK/4ZfDA8ol/wJtR9DjlJHEg/0qVEbbuh9k8TuYYGPZxJ1E6PUD+A3FVch9iRJhET0GmouZGItRpqu1VHTPECLit2/xLOV+LbIWe/4p/BR4PfDPiKdcVLuIm3DSIHcE/8HKtj2A7CYrn3UwSnGgTs1fjn8HqUO8DvEfOGMKtYo8fdhPu4mCNgbQzkpa3XkaTG8JXI3Gagh5e5xSsON+MvLCu+7TuG73I3xO4ofl5K/2q+9gLLeG/wl+t5RMCLvvh8qHl8XPI6rEYEPMtplLuKNxVHU+IAnzJ7TfCf4y+1kepxyfi12AAAAABJRU5ErkJggg==",
    alert: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAABV0lEQVRYhe2VP0oDQRjFfwQi0UqNpRDwAoI3MJhb6AkEGz2FnsLcQk8ggkHF0qiNYGEsLNTCMBaZgXHy7fzZ7E61D16xM+/73rc7w1toUB594FGzn9t8DZgASnOi17LhzDI3PM1lvgl8CQN8A70cAwwFc8Pzus23galngCmwU+cAlx5zw4u6zHcjzA0HVZu3gJFlcAe0rf22XjP7I11TGQ74/4ZXguba0exXZb4EjJ3m94LuwdG8AJ1Q85jPdARsOWvLgm7Fee4BhxH9vVgF3pm/ZK+C9k3QfQDriwwgRa5p7OKzQFs6oosiVwE/gv63QFs6on2Rq5gdj8FGQDtMNQ9FbiqTIzomclMZHdGDyIZdq6YbWROM6BZwE9nMRUzNLYHscSO36gEUnojuMIvP2EZljkDhieiThCaL8lga4DnjAE/G1L4Q0rlmxR7zv906ONZeDRoA8AcUklEqQcSO3AAAAABJRU5ErkJggg==",
    check: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAABuklEQVRYhe3Wu2sUURQG8J/GTlPETtKIiEnto0gna5Mqq4UKakBBhPTRf0awsTVgYWFjYqdg7JPSEBCbxEcjuNm1mDtkd/bOnc3NWrkfnGLO6/tm7pwzwwQT5KGFDnrBOrie0+hkpoBrmOq7nsKVfyXgCTZwqc83F8mbr8Q38DBHVD+eOnzMP3Abd7Hb5y9tJ8Qe4GfwdbGSS/4oNKgSHdW6QdiR8W4M5KWt5Qi4gL0xkH/DbI4AuDUGAYspgqYpOF3j30Ib08FuYrsm92yK4ETEt4irirFq4VyEfAHfK/4ZfDA8ol/wJtR9DjlJHEg/0qVEbbuh9k8TuYYGPZxJ1E6PUD+A3FVch9iRJhET0GmouZGItRpqu1VHTPECLit2/xLOV+LbIWe/4p/BR4PfDPiKdcVLuIm3DSIHcE/8HKtj2A7CYrn3UwSnGgTs1fjn8HqUO8DvEfOGMKtYo8fdhPu4mCNgbQzkpa3XkaTG8JXI3Gagh5e5xSsON+MvLCu+7TuG73I3xO4ofl5K/2q+9gLLeG/wl+t5RMCLvvh8qHl8XPI6rEYEPMtplLuKNxVHU+IAnzJ7TfCf4y+1kepxyfi12AAAAABJRU5ErkJggg=="
}

JmeMaintenance.Settings = {
    scheduledMaintenance: "00 1 1 * *",
    maintenanceDurationInHours: 1,
    maintenanceNoticeDurationInHours: 2,
    debugTimeSpeed: 1
}

JmeMaintenance.cronToDate = function (cron) {
    later.date.UTC();
    const s = later.parse.cron(cron, false);
    const scheduler = later.schedule(s);

    const prev= scheduler.prev(0);
    const currentDate = JmeMaintenance.getTime();
    let delta = (currentDate - prev) / 1000;
    delta = Math.abs(delta);
    let deltaH = Math.floor(delta / 3600);
    if(deltaH<24){
        return prev;
    }
    const next= scheduler.next(0);
    return next;
}

JmeMaintenance.showMaintenanceMessage = function (icon, type, message) {
    const body = document.querySelector("body");
    let maintenanceEl = body.querySelector("#jme-a-maintenance");
    if (maintenanceEl) {
        console.log("Clear maintenance message");
        maintenanceEl.innerHTML = "";
    } else {
        console.log("Create new maintenance message");
        maintenanceEl = document.createElement("div");
        maintenanceEl.setAttribute("id", "jme-a-maintenance");
        maintenanceEl.addEventListener("click", function (ev) {
            maintenanceEl.style.display = "none";
        });
        body.appendChild(maintenanceEl);
    }

    if (type && !maintenanceEl.className != type) {
        maintenanceEl.className = type;
        maintenanceEl.style.display = "flex";
    }

    console.info(message);

    const iconEl = document.createElement("img");
    iconEl.setAttribute("src", icon);
    maintenanceEl.appendChild(iconEl);

    const messageEl = document.createElement("span");
    messageEl.innerHTML = message;
    maintenanceEl.appendChild(messageEl);


}


JmeMaintenance.getTime = function () {
    let date = Date.now();

    if (JmeMaintenance.Settings.debugTimeSpeed > 1) {
        if (!JmeMaintenance.prevDate) JmeMaintenance.prevDate = date;
        let virtualDate = JmeMaintenance.prevDate + (date - JmeMaintenance.prevDate) * JmeMaintenance.Settings.debugTimeSpeed;
        date = virtualDate;
    }

    return date;
}


JmeMaintenance.showScheduledMaintenanceMessage = function () {
    const nextMaintenance = JmeMaintenance.cronToDate(JmeMaintenance.Settings.scheduledMaintenance);
    const currentDate = JmeMaintenance.getTime();


    let delta = (nextMaintenance - currentDate) / 1000;
    const sign = Math.sign(delta);
    delta = Math.abs(delta);
    let deltaH = Math.floor(delta / 3600);
    let deltaM = Math.floor((delta - (deltaH * 3600)) / 60);
    console.log("Maintenance in",deltaH,"hours and ",deltaM,"minutes",sign,JmeMaintenance.Settings.maintenanceNoticeDurationInHours);

    if (sign <= 0) {
        if (deltaH < JmeMaintenance.Settings.maintenanceDurationInHours) {
            JmeMaintenance.showMaintenanceMessage(JmeMaintenance.Icons.cog, "jme-a-maintenance-inprogress", "Maintenance in progress...");
            if (localStorage) localStorage.setItem('jme-a-maintenance', '1');
            setTimeout(JmeMaintenance.showScheduledMaintenanceMessage, Math.max(1, 1000 / JmeMaintenance.Settings.debugTimeSpeed));
            return;
        } else {
            const mFlag = localStorage.getItem('jme-a-maintenance');
            if (localStorage && mFlag && mFlag == "1") {
                JmeMaintenance.showMaintenanceMessage(JmeMaintenance.Icons.check, "jme-a-maintenance-completed", "Maintenance completed! All services should be back to normal.");
                localStorage.removeItem('jme-a-maintenance');
            }
        }
    } else {
        if (deltaH <= JmeMaintenance.Settings.maintenanceNoticeDurationInHours) {
            JmeMaintenance.showMaintenanceMessage(JmeMaintenance.Icons.alert, "", "Scheduled unattended maintenance will start in " + deltaH + " hours and " + deltaM + " minutes. <br />Slowdowns and hiccups are expected during this process.");
            if (localStorage) localStorage.setItem('jme-a-maintenance', '1');
            setTimeout(JmeMaintenance.showScheduledMaintenanceMessage, Math.max(1, (1000 * 60) / JmeMaintenance.Settings.debugTimeSpeed));
            return;
        }
    }
    setTimeout(JmeMaintenance.showScheduledMaintenanceMessage, Math.max(1, (20 * 60 * 1000) / JmeMaintenance.Settings.debugTimeSpeed));
}

if (document.readyState === 'complete') {
    JmeMaintenance.showScheduledMaintenanceMessage();
} else {
    document.addEventListener("DOMContentLoaded", function () {
        JmeMaintenance.showScheduledMaintenanceMessage();
    });
}
