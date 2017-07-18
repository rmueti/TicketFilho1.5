var campos_requeridos=[];

$(function(){
	var client = ZAFClient.init();
	client.invoke('resize', { width: '90%', height: '400px' });
	menu();
});

function clicou()
{
	var client = ZAFClient.init();
	ticketOrganize(client, function(data){
		showInfo(data);
		hideConditionals();
	});
}

function menu()
{
	var source = $("#menu").html();
	var template = Handlebars.compile(source);
	var html = template();
	$("#content").html(html);
}

function showInfo(data)
{
	var source = $("#requester-template").html();
	var template = Handlebars.compile(source);
	var html = template(data);
	$("#content").html(html);
}

//Get the current ticket, if the app is ticket_sidebar.
//Do not return custom filds in the JSON, but it is quicker.
//This function also returns all information about the requester.
function getCurrentTicket(client, callback)
{
	client.get('ticket').then( function(data)
	{
		callback(data);
	},
	function(errorData)
	{
		console.log(errorData);
	});
}

//Request via API the current ticket, if the app is ticket_sidebar.
//Return custom fields in the JSON, but it is slower.
function requestCurrentTicket(client, callback) {
	client.get('ticket.id').then( function (ticket) {
		var settings = {
			url: '/api/v2/tickets/' + ticket['ticket.id'] + '.json',
			type:'GET',
			dataType: 'json',
		};
		client.request(settings).then(
			function(data) {
				callback(data);
			},
			function(errorData) {
				console.log(errorData);
		});
	});
};

//Request via API the current ticket requester, if the app is ticket_sidebar.
//Return data into JSON.
function requestCurrentRequester(client, callback) {
	client.get('ticket.requester.id').then( function (ticket) {
		var settings = {
			url: '/api/v2/users/' + ticket['ticket.requester.id'] + '.json',
			type:'GET',
			dataType: 'json',
		};	
		client.request(settings).then(
			function(data) {
				callback(data);
			},
			function(errorData) {
				console.log(errorData);
		});
	});
};

//Request via API the current ticket form, if the app is ticket_sidebar and app has the version that enable multiple forms.
//Return data into JSON.
function requestCurrentForm(client, callback) {
	client.get('ticket.form.id').then( function (ticket) {
		var settings = {
			url: '/api/v2/ticket_forms/' + ticket['ticket.form.id'] + '.json',
			type:'GET',
			dataType: 'json',
		};	
		client.request(settings).then(
			function(data) {
				callback(data);
			},
			function(errorData) {
				console.log(errorData);
		});
	});
};

//Request via API all the fields in the current org.
//Return data into JSON.
function requestAllTicketFields(client, callback) {
	var settings = {
		url: '/api/v2/ticket_fields.json',
		type:'GET',
		dataType: 'json',
	};	
	client.request(settings).then(
		function(data) {
			callback(data);
		},
		function(errorData) {
			console.log(errorData);
	});
};

function cria_ticket()
{
	var client = ZAFClient.init();
	var formulario = [];
	var post = [];
	requestCurrentForm(client, function(data)
	{
		var currentTicketForm = data.ticket_form.ticket_field_ids;
		$.each(currentTicketForm, function(index,id)
		{
			if($('#'+id).val()!=undefined)
			{
				formulario[id]=$('#'+id).val();
			}
		});
		
		post['ticket']=formulario;
		
		console.log(data);
		console.log(post);
		
		/*var settings = {
			url: '/api/v2/tickets.json',
			type:'POST',
			dataType: 'json',
			data: JSON.stringify(post)
		};	
		client.request(settings).then(
			function(data) {
				console.log(data);
			},
			function(errorData) {
				console.log(errorData);
		});*/
	});

	
};

//function to organize the current form into a JSON with all info
function ticketOrganize(client, callback) {
	campos_requeridos = [];
	//empty variable for organized ticket form with all info
	
	var formatedTicketForm = {
		ticket_fields : []
	};
	requestAllTicketFields(client, function(data) {
		var allFields = data;
		requestCurrentForm(client, function(data) {
			var currentTicketForm = data;
			for(i=0; i < currentTicketForm.ticket_form.ticket_field_ids.length; i++){
				for(j=0; j< allFields.ticket_fields.length; j++) {
					if(currentTicketForm.ticket_form.ticket_field_ids[i] == allFields.ticket_fields[j].id)
					{
						if(allFields.ticket_fields[j].required===true)
						{
							campos_requeridos.push(allFields.ticket_fields[j].id);
						}
						formatedTicketForm.ticket_fields.push(allFields.ticket_fields[j]);							
					}
				}
			}
			callback(formatedTicketForm);		
		});
	});
}

function onPickSelect(field_id, field_value)
{
	$.each(cfaRules, function(index,valor)
	{
		if(field_id==valor.field)
		{
			$.each(valor.select, function(index,selecionado)
			{
				$('#campo_'+selecionado).addClass('hidden_box');
				$('#campo_'+selecionado).removeClass("shown_box");
				$('#campo_'+selecionado).removeAttr('required');
			});
		}
	});
	
	$.each(cfaRules, function(index,valor)
	{
		if(field_id==valor.field && field_value==valor.value)
		{
			$.each(valor.select, function(index,selecionado)
			{
				$('#campo_'+selecionado).addClass('shown_box');
				$('#campo_'+selecionado).removeClass("hidden_box");
			});
		}
	});
}

function hideConditionals()
{
	var allIds = [];
	var text = document.getElementsByTagName("input");
	for(i=0;i<text.length;i++)
	{
		allIds.push('campo_'+text[i].id);
	}
	var select = document.getElementsByTagName("select");
	for(i=0;i<select.length;i++)
	{
		allIds.push('campo_'+select[i].id);
	}
	
	var hiddenIds = [];
	for (i=0; i < cfaRules.length; i++)
	{
		for(j=0; j < cfaRules[i].select.length; j++)
		{
			hiddenIds.push('campo_'+cfaRules[i].select[j]);
		}
	}
	hiddenIds = hiddenIds.map(String);
	
	for(i=0; i < allIds.length; i++)
	{
		if($.inArray(allIds[i], hiddenIds)!=-1)
		{
			hiddenIds[i].className += $('#'+hiddenIds[i]).addClass('hidden_box');
		}
	}
}

function valida_campos_requeridos()
{
	var erro=false;
	$.each(campos_requeridos, function(index,id)
	{
		if($('#'+id).val()=="")
		{
			$('#error_'+id).html('Atenção, este campo é obrigatório.');
			$('#'+id).focus();
			erro=true;
		}
		else
		{
			$('#error_'+id).html('');
		}
	});
	if(!erro)
	{	
		cria_ticket();
	}
}

//Handlebars function to coditional if v1 equals v2
Handlebars.registerHelper('ifEquals', function(v1, v2, options) {
	if(v1 == v2)
	{
		return options.fn(this);
	}
	return options.inverse(this);
});
