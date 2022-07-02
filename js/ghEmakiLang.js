///////////////////////////////////////
//  Languages
//
if ( typeof GH_LANG == 'undefined' ) {
    var GH_LANG = 'en';
}
const GH_TXT_STATUS = [
    {'en' : 'retreat','ja' : '敗退' },
    {'en' : ' ','ja' : ' ' },
    {'en' : 'replenish','ja' : '補給' },
    {'en' : 'wait','ja' : '待機' },
    {'en' : 'chase','ja' : '追跡' },
    {'en' : 'move','ja' : '移動' }
];

const GH_TXT_ATTACK = {
    'en' : 'attack',
    'ja' : '攻撃'
};

const GH_TXT_DEFENSE = {
    'en' : 'Defense',
    'ja' : '防御'
}
const GH_TXT_NODES = {
    'en' : 'Strength',
    'ja' : '兵数'
}
const GH_TXT_FATIGUE = {
    'en' : 'Fatigue',
    'ja' : '疲労'
}
const GH_TXT_DAMAGE = {
    'en' : ' damage ',
    'ja' : ' 負傷 '
}
const GH_TXT_LOST = {
    'en' : 'lost',
    'ja' : '敗退'
}
const GH_TXT_OVER = {
    'en' : 'Over',
    'ja' : '終了'
}
const GH_TXT_BULLET = {
    'en' : 'Bullet',
    'ja' : '弾薬'
}

//const GH_TXT_ACTION = {
//    'attack' : {
//	'en' : 'attack',
//	'ja' : '攻撃'
//    },
//    'chase' : {
//	'en' : 'chase',
//	'ja' : '追跡'
//    },
//    'route' : {
//	'en' : 'move',
//	'ja' : '移動'
//    },
//    'wait' : {
//	'en' : 'wait',
//	'ja' : '待機'
//    },
//    'replenish' : {
//	'en' : 'replenish',
//	'ja' : '補給'
//    },
//    'retreat' : {
//	'en' : 'retreat',
//	'ja' : '敗退'
//    }
//}


//
//const GH_EVT_MSG_MOVE = {
//    'en' : ' move command target',
//    'ja' : ' 移動命令 目標 '
//}
//const GH_EVT_MSG_FORMATION = {
//    'en' : ' formation command ',
//    'ja' : ' 陣形命令 '
//}
//const GH_EVT_MSG_DIRECTION = {
//    'en' : ' direction command target',
//    'ja' : ' 方向命令 目標 '
//}
//const GH_EVT_MSG_WAIT = {
//    'en' : ' wait command ',
//    'ja' : ' 待機命令 '
//}
//const GH_EVT_MSG_FORT_OUT = {
//    'en' : ' leave the base ',
//    'ja' : ' 拠点離脱 '
//}
//const GH_EVT_MSG_FORT_IN = {
//    'en' : ' the base ',
//    'ja' : ' 拠点 '
//}
//
//
//const GH_TXT_DEFENSE = {
//    'en' : 'Defense',
//    'ja' : '防御'
//}
//const GH_TXT_NODES = {
//    'en' : 'Nodes',
//    'ja' : '兵数'
//}
//const GH_TXT_FATIGUE = {
//    'en' : 'Fatigue',
//    'ja' : '疲労'
//}
//const GH_TXT_DAMAGE = {
//    'en' : ' damage ',
//    'ja' : ' 負傷 '
//}
//
//const GH_TXT_ATK_TGT = {
//    'en' : 'Attack Target',
//    'ja' : '攻撃目標'
//}
//const GH_TXT_CHASE_TGT = {
//    'en' : 'Chase Target',
//    'ja' : '追尾目標'
//}
//const GH_TXT_ROUTE_SPEED = {
//    'en' : 'Speed[Km/h]',
//    'ja' : '速度[Km/h]'
//}
//const GH_TXT_WAIT = {
//    'en' : 'Wait',
//    'ja' : '待機'
//}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//const GH_TXT_LATLNG = {
//    'en' : 'pos',
//    'ja' : '位置'
//}
//const GH_TXT_NULL = {
//    'en' : 'NO',
//    'ja' : 'なし'
//}
//const GH_TXT_STATUS = {
//    'en' : 'Status',
//    'ja' : '状態'
//}
//const GH_TXT_TARGET = {
//    'en' : 'Target',
//    'ja' : '目標'
//}
//const GH_TXT_LEAD = {
//    'en' : 'Lead',
//    'ja' : '統率'
//}
//const GH_TXT_MOBILITY = {
//    'en' : 'Mobility',
//    'ja' : '移動'
//}
//const GH_TXT_OFFENSE = {
//    'en' : 'Offence',
//    'ja' : '攻撃'
//}
//const GH_TXT_CRITICALHIT = {
//    'en' : ' critical hit ',
//    'ja' : ' クリティカルヒット '
//}
//const GH_TXT_STATUS_WAIT = {
//    'en' : 'waiting',
//    'ja' : '待機中'
//}
//const GH_TXT_STATUS_MOVE = {
//    'en' : 'moving',
//    'ja' : '移動中'
//}
//const GH_TXT_STATUS_ALERT = {
//    'en' : 'warning',
//    'ja' : '警戒中'
//}
//const GH_TXT_STATUS_ATTACK = {
//    'en' : 'in battle',
//    'ja' : '交戦中'
//}
//const GH_TXT_ALERT_TARGET = {
//    'en' : 'click target object',
//    'ja' : '対象を指定してください'
//}
//const GH_TXT_ALERT_FORMATION = {
//    'en' : 'select formation',
//    'ja' : '陣形を指定してください'
//}
//
//////////////////////////////////////////
//
//var GH_STATUS_TXT = Array(10);
//GH_STATUS_TXT.fill({
//    'en' : 'defeat',
//    'ja' : '敗退'
//});
//GH_STATUS_TXT[GH_STATUS_WAIT] = {
//    'en' : 'waiting',
//    'ja' : '待機中'
//};
//GH_STATUS_TXT[GH_STATUS_MOVE] = {
//    'en' : 'moving',
//    'ja' : '移動中'
//}
//GH_STATUS_TXT[GH_STATUS_ATTACK] = {
//    'en' : 'attacking',
//    'ja' : '攻撃中'
//}
//GH_STATUS_TXT[GH_STATUS_ATTACKED_YES] = {
//    'en' : 'defending',
//    'ja' : '防御中'
//}

