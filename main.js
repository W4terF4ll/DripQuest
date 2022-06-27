//overall stats
var player_dripscore = 0;
var player_maxhealth = 100;
var player_bonusmaxhealth = 0;
var player_minhealth = (player_maxhealth + player_bonusmaxhealth);
var player_damage = 10;
var player_bonusdamage = 0;
var player_fortune = 0;
var player_bonusfortune = 0;
var player_dripcoin = 0;

//zone specific stats
var enemy_minhealth;
var enemy_maxhealth;
var enemy_damage;
var zone_health;
var zone_damage;
var zone_design_one = "";
var zone_design_two = "";
var zone_lootchances = [];
var zone_loottable_fightzone = [];
var zone_lootvar = [];

//loot & loadout
//[dripscore, name, damage, health, fortune]
// 0 = bonusdamage, 1 = bonusmaxhealth, 2 = bonusfortune
var allloot = [[0, "stick", 5, 0, 0], [30, "top hat", 0, 10, 5], [5, "jeans", 0, 15, 0], [40, "leather jacket", 2, 20, 0], [100, "cross necklace", 0, 5, 20], [5, "brass knuckles", 12, 0, 0], [15, "rubber boots", 3, 15, 3], [77, "really big sword", 40, -50, 0], [300, "gold watch", 0, 0, 50]];
var player_loadout = [-1, -1, -1, -1, -1];

//shop
var shop_current;
var shop_items = [];
var shop_prices = [];

//constantly changing vars updater
setInterval(function() {
    document.getElementsByClassName("fight_player_health")[0].innerHTML = player_minhealth + "/" + (player_maxhealth + player_bonusmaxhealth);
    document.getElementsByClassName("fight_player_damage")[0].innerHTML = (player_damage + player_bonusdamage);
    document.getElementsByClassName("fight_enemy_health")[0].innerHTML = enemy_minhealth + "/" + enemy_maxhealth;
    document.getElementsByClassName("fight_enemy_damage")[0].innerHTML = enemy_damage;
    document.getElementsByClassName("resources")[0].innerHTML = "<span style=\"color:lightblue\">DripCoin: " + player_dripcoin + "</span>";
}, 10);

//item movement, equipping items, shop purchasing
document.addEventListener('DOMContentLoaded', (event) => {
    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        e.dataTransfer.setData('itemId', this.style.tabSize);
        e.dataTransfer.setData('itemType', this.id);
    }
    function handleDragOver(e) {
        e.preventDefault();
        return false;
    }
    function handleDragEnter() {
        if (this.id.substring(0, 4) !== "shop") {
            this.style.borderColor = 'lightgrey';
        }
    }
    function handleDragLeave() {
        if (this.id.substring(0, 4) !== "shop") {
            this.style.borderColor = 'black';
        }
    }
    function handleDrop(e) {
        e.stopPropagation();
        if (dragSrcEl !== this && this.id.substring(0,4) !== "shop") {
            this.style.borderColor = 'black';
            dragSrcEl.innerHTML = this.innerHTML;
            dragSrcEl.style.tabSize = this.style.tabSize;
            this.innerHTML = e.dataTransfer.getData('text/html');
            this.style.tabSize = e.dataTransfer.getData('itemId');
            if (dragSrcEl.id.substring(0, 4) == "shop" && (this.id.substring(0, 9) == "inventory" || this.id.substring(0, 7) == "loadout")) {
                shop_purchase(dragSrcEl.id.substring(5, 6));
            }
            player_update();
        }
        return false;
    }
    let items = document.querySelectorAll('.inventory_space');
        items.forEach(function (item) {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
    });
});


//sets zone specific stats
function pre_travel(num) {
    shop_travel(-1);
    if (num == 0) {
        zone_health = Math.floor(20 + (Math.random() * 40));
        zone_damage = Math.floor(5 + (Math.random() * 10));
        zone_design_one = ":(";
        zone_design_two = ":O";
        zone_lootchances = [100, 50, 25, 10, 5];
        zone_loottable = ["stick", "top hat", "jeans", "leather jacket", "cross necklace"];
        zone_lootvar = [1, 2, 3, 4, 5];
    } else if (num == 1) {
        zone_health = Math.floor(50 + (Math.random() * 50));
        zone_damage = Math.floor(15 + (Math.random() * 15));
        zone_design_one = ">:(";
        zone_design_two = ">:O";
        zone_lootchances = [40, 30, 30, 10, 5];
        zone_loottable = ["rubber boots", "brass knuckles", "cross necklace", "really big sword", "gold watch"];
        zone_lootvar = [7, 6, 5, 8, 9];
    }
    var loottable_display = "";
    var color = "";
    for (var i = 0; i < zone_loottable.length; i++) {
        if (zone_lootchances[i] * (1 + ((player_fortune + player_bonusfortune)/100)) >= 60) {
            color = "lightgreen"
        } else if (zone_lootchances[i] * (1 + ((player_fortune + player_bonusfortune)/100)) >= 25) {
            color = "gold"
        } else if (zone_lootchances[i] * (1 + ((player_fortune + player_bonusfortune)/100)) >= 10) {
            color = "red"
        } else if (zone_lootchances[i] * (1 + ((player_fortune + player_bonusfortune)/100)) >= 5) {
            color = "darkred"
        }
        loottable_display += "<span>" + zone_loottable[i] + ": <span style=\"color:" + color + "\">" + (zone_lootchances[i] * (1 + ((player_fortune + player_bonusfortune)/100))).toFixed(2) + "%</span></span><br><br>";
    }
    document.getElementsByClassName("drop_table")[0].innerHTML = loottable_display;
    travel();
}

//finalizes stats, spawns enemy, starts fight
async function travel() {
    zone_update(0);
    enemy_maxhealth = zone_health;
    enemy_minhealth = enemy_maxhealth;
    enemy_damage = zone_damage;
    document.getElementsByClassName("fight_enemy")[0].innerHTML = zone_design_one;
    document.getElementsByClassName("enemy_class")[0].style.display = "inline-block";
    document.getElementById("fight_distance").style.display = "inline-block";
    var travel_move = 9;
    while (travel_move != 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        document.getElementById("fight_distance").style.marginLeft = travel_move + "%";
        travel_move -= 1;
    }
    fight();
}

//fight, if player wins runs loot
async function fight(design_one, design_two) {
    while (player_minhealth > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        document.getElementsByClassName("fight_player")[0].innerHTML = "\\o\\";
        document.getElementsByClassName("fight_enemy")[0].innerHTML = zone_design_one;
        enemy_minhealth = enemy_minhealth - (player_damage + player_bonusdamage);
        document.getElementsByClassName("logs_battle_output")[0].innerHTML += "<br>You attacked for <span style=\"color:red\">" + (player_damage + player_bonusdamage) + "</span> damage!<br>"
        if (enemy_minhealth <= 0) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        document.getElementsByClassName("fight_player")[0].innerHTML = "\\o/";
        document.getElementsByClassName("fight_enemy")[0].innerHTML = zone_design_two;
        player_minhealth = player_minhealth - enemy_damage;
        document.getElementsByClassName("logs_battle_output")[0].innerHTML += "<br>Enemy attacked for <span style=\"color:red\">" + enemy_damage + "</span> damage!<br>"
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (player_minhealth < 0) {
        document.getElementsByClassName("logs_battle_output")[0].innerHTML += "<br><span style=\"color:red\">You were defeated...</span><br>"
        player_minhealth = (player_maxhealth + player_bonusmaxhealth);
    } else {
        document.getElementsByClassName("logs_battle_output")[0].innerHTML += "<br><span style=\"color:lightgreen\">Enemy was defeated!</span><br>"
        loot();
    }
    zone_update(1);
    document.getElementsByClassName("fight_player")[0].innerHTML = "\\o/";
    document.getElementsByClassName("fight_enemy")[0].innerHTML = zone_design_one;
    document.getElementsByClassName("enemy_class")[0].style.display = "none";
    document.getElementById("fight_distance").style.display = "none";
    document.getElementById("fight_distance").style.marginLeft = "10%";
}

//awards items & coins if player wins
function loot(){
    var loot_dripcoin = Math.floor((Math.random() * ((zone_health + zone_damage)/10)) * (1 + ((player_fortune + player_bonusfortune)/100)));
    if (loot_dripcoin > 0) {
        player_dripcoin += loot_dripcoin;
        document.getElementsByClassName("logs_battle_output")[0].innerHTML += "<br><span style=\"color:lightblue\">You received: " + loot_dripcoin + " DripCoin!</span><br>";
    }
    for (i = 0; i < zone_lootchances.length; i++) {
        if ((Math.random() * 100) <= (zone_lootchances[i] * (1 + ((player_fortune + player_bonusfortune)/100)))){
            for (j = 1; j <= 18; j++) {
                if (document.getElementById("inventory_" + j).innerText == "") {
                    document.getElementById("inventory_" + j).style.tabSize = zone_lootvar[i];
                    document.getElementById("inventory_" + j).innerHTML += "<p draggable=\"true\" style=\"margin-top: 0; margin-bottom: 0; display: inline-block; vertical-align: bottom; cursor: move;\">" + zone_loottable[i] + "</p>";
                    break;
                }
            }
            if (zone_lootchances[i] <= 10) {
                document.getElementsByClassName("logs_battle_output")[0].innerHTML += "<br><span style=\"color:pink\">RARE DROP!! You received: " + zone_loottable[i] + "!</span><br>";
            } else {
                document.getElementsByClassName("logs_battle_output")[0].innerHTML += "<br><span style=\"color:gold\">You received: " + zone_loottable[i] + "!</span><br>";
            }
        }
    }
}

//updates players stats when new items are equipped
function player_update() {
    var player_tempdripscore = 0;
    var player_tempbonusdamage = 0;
    var player_tempbonusmaxhealth = 0;
    var player_tempbonusfortune = 0;
    for (i = 0; i <= 4; i++) {
        player_loadout[i] = (document.getElementById("loadout_" + (i+1)).style.tabSize) - 1;
        if (player_loadout[i] != -1) {
            player_tempdripscore += allloot[player_loadout[i]][0];
            player_tempbonusdamage += allloot[player_loadout[i]][2];
            player_tempbonusmaxhealth += allloot[player_loadout[i]][3];
            player_tempbonusfortune += allloot[player_loadout[i]][4];
        }
    }
    player_dripscore = player_tempdripscore;
    player_bonusdamage = player_tempbonusdamage;
    player_bonusmaxhealth = player_tempbonusmaxhealth;
    player_bonusfortune = player_tempbonusfortune;
    var statdisplaytext = "";
    if (player_dripscore != 0) {
        statdisplaytext += "<span style=\"color:blue\">DripScore: " + player_dripscore + "</span><br><br>";
    }
    if (player_bonusdamage != 0) {
        statdisplaytext += "<span style=\"color:red\">Bonus Damage: " + player_bonusdamage + "</span><br><br>";
    }
    if (player_bonusmaxhealth != 0) {
        statdisplaytext += "<span style=\"color:lightgreen\">Bonus Health: " + player_bonusmaxhealth + "</span><br><br>";
    }
    if (player_bonusfortune != 0) {
        statdisplaytext += "<span style=\"color:gold\">Bonus Fortune: " + player_bonusfortune + "</span>";
    }
    document.getElementsByClassName("stats")[0].innerHTML = statdisplaytext;
    zone_update(2);
}

//unlocks zones when dripscore is met
//0 = going to fight, 1 = exiting fight, 2 = checking if shop is open
function zone_update(num) {
    var buttons_fight = document.getElementsByClassName("fight_button");
    var buttons_shop = document.getElementsByClassName("shop_button");
    if (num == 0) {
        for (var i = 0; i < buttons_fight.length; i++) {
            buttons_fight[i].disabled = true;
        }
        for (var i = 0; i < buttons_shop.length; i++) {
            buttons_shop[i].disabled = true;
        }
    } else if (num == 1) {
        for (var i = 0; i < buttons_fight.length; i++) {
            buttons_fight[i].disabled = false;
        }
        zone_update(2);
    } else if (num == 2) {
        if (player_dripscore >= 150) {
            document.getElementsByClassName("shop_button")[0].disabled = false;
        } else {
            document.getElementsByClassName("shop_button")[0].disabled = true;
        }
    }
}

//opens the shop and sets prices
function shop_travel(num) {
    if (num == -1) {
        for (i = 1; i <= 18; i++) {
            document.getElementById("shop_" + i).style.display = "none";
            document.getElementById("shop_" + i).style.tabSize = 0;
            document.getElementById("shop_" + i).innerHTML = "";
        }
        return;
    } else if (num == 0) {
        shop_current = num;
        shop_items = [2, 6, 8, 9];
        shop_prices = [10, 15, 25, 50];
    }
    for (i = 1; i <= shop_items.length; i++) {
        document.getElementById("shop_" + i).style.display = "flex";
        document.getElementById("shop_" + i).style.tabSize = shop_items[i-1];
        if (shop_prices[i-1] <= player_dripcoin) {
            document.getElementById("shop_" + i).innerHTML = "<p draggable=\"true\"; title=\"Cost: " + shop_prices[i-1] + " DripCoin\"; style=\"margin-top: 0; margin-bottom: 0; display: inline-block; vertical-align: bottom; cursor: move;\">" + allloot[shop_items[i-1]-1][1] + "</p>";
            document.getElementById("shop_" + i).style.borderColor = "black";
        } else {
            document.getElementById("shop_" + i).innerHTML = "<p draggable=\"false\"; title=\"Cost: " + shop_prices[i-1] + " DripCoin\"; style=\"margin-top: 0; margin-bottom: 0; color: lightgrey;  display: inline-block; vertical-align: bottom;\">" + allloot[shop_items[i-1]-1][1] + "</p>";
            document.getElementById("shop_" + i).style.borderColor = "lightgrey";
        }
    }
}

//updates players dripcoin when buying item
function shop_purchase(num){
    player_dripcoin -= shop_prices[num - 1];
    shop_travel(shop_current);
}
