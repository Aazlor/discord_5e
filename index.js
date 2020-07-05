const Discord = require('discord.js');

// Extract the required classes from the discord.js module
const { Client, MessageEmbed } = require('discord.js');

const client = new Discord.Client();


function rollDie(sides) {
	return Math.floor(Math.random() * Math.floor(sides)) + 1;
}

function hashCode(str) { // java String#hashCode
	var hash = 0;
	for (var i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	return hash;
}
function intToRGB(i){
	var c = (i & 0x00FFFFFF)
		.toString(16)
		.toUpperCase();

	return "00000".substring(0, 6 - c.length) + c;
}


client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
	// if (message.author != null && (message.content.startsWith('!') || message.content.includes('d'))) {
	if (message.content.match(/^(!\d+[d]\d+|![d]\d+|-\d+[d]\d+|-[d]\d+|\d+[d]\d+|[d]\d+)/)){
		var msg = message.content.replace(/!/gim, '');

		// var str = "2d20 adv + 2d4 + 3d8-4+7-2d6+d10 - 2d20 dis";
		var res = msg.match(/(^|\+|\-).*?(?=\+|\-|$)/gim);
		var count = 0;

		var rt_msg = ''; //msg;

		for (var i = 0; i < res.length; i++) {
			var parse = res[i].replace(/!|\-|\+|( )/gim, '')
			var split = parse.split(/(adv)|d/gi);
			var rolled = [];
			
			if(res[i].includes("adv") || res[i].includes("dis")){
				rt_msg += ' '+res[i].replace(/( )/gi, '');
				var srt = [];
				console.log(split);
				var ii = 0;
				do {
					var roll1 = rollDie(split[2]);
					var roll2 = rollDie(split[2]);

					if(res[i].includes('adv')){
						var roll = (roll1 > roll2) ? roll1 : roll2;
					}
					else if(res[i].includes('dis'))
						var roll = (roll1 < roll2) ? roll1 : roll2;

					if(res[i].includes('adv'))
						rt_msg += (roll1 >= roll2) ? ' [**'+roll1+'**,'+roll2+'] ' :  ' ['+roll1+',**'+roll2+'**] ';
					else if(res[i].includes('dis'))
						rt_msg += (roll1 <= roll2) ? ' [**'+roll1+'**,'+roll2+'] ' :  ' ['+roll1+',**'+roll2+'**] ';
					count += roll;
					ii++;
				}while(ii < split[0])
			}
			else if(res[i].includes('d')){
				rt_msg += ' '+res[i].replace(/( )/gi, '')+'[';
				var ii = 0;
				do {
					var rolled = rollDie(split[2]);

					count += (res[i].includes('-')) ? -Math.abs(rolled) : rolled;

					ii++;
					if(ii > 1)
						rt_msg += ',';
					rt_msg += rolled;
				}while(ii < split[0])
				rt_msg += '] ';
			}
			else{
				var modifier = res[i].replace(/\D/g, '');
				count += (res[i].includes('-')) ? -Math.abs(parseInt(modifier)) : parseInt(modifier);
				rt_msg += res[i].replace(/( )/g, '')+' ';
			}
		}

		var displayName = message.guild.members.cache.get(message.author.id).nickname;
		displayName = (displayName != null) ? displayName : message.author.username;
		console.log(displayName)
		var hex = '0x'+intToRGB(hashCode(displayName));
		console.log(hex);

		const embed = new MessageEmbed()
			// Set the title of the field
			.setTitle(displayName+': '+count)
			// Set the color of the embed
			.setColor(hex)
			// Display
			.addField('Rolls:', rt_msg, true);
		message.channel.send(embed);
	}
});

