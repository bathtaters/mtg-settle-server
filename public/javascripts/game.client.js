/// <reference path="./jquery-3.6.0.min.js" />

//- JS: #previewCard: updates href to data-preview of #newCard when it is changed (& onLoad)

$( "#_actionDelete" ).on("click", function(ev) {
  if (!window.confirm("Are you sure you want to delete the current game?")) { ev.preventDefault(); }
});

$( "#randomCard" ).on("click", function() {
  var cards = $( "#newCard > option" );
  cards[Math.floor(Math.random() * cards.length)].selected = "selected";
  $( "#newCard" ).trigger("change");
});

$( "#newCard" ).on("change", function() {
  $( "#previewCard" ).attr("href",
    $( this ).find(":selected").attr("data-preview")
  );
});

$(function() { $( "#newCard" ).trigger("change"); });