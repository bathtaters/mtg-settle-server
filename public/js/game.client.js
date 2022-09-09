/// <reference path="../../engine/public/javascripts/jquery-3.6.0.min.js" />

/* delete game confirmation */
$( "#_actionDelete" ).on("click", function(ev) {
  if (!window.confirm("Are you sure you want to delete the current game?")) { ev.preventDefault(); }
});

/* add img details */
$( "tr.tableRow" ).each(function() {
  var detail = $(this).find(".imgDetail");

  $(this).find(".cardImg img").one("load", function() {
    detail.text($(this).height()*2 + "px x " + $(this).width()*2 + "px");
  }).each(function() {
    if (this.complete) { $(this).trigger('load'); }
  });
});

/* pick random card */
$( "#randomCard" ).on("click", function() {
  var cards = $( "#newCard > option" );
  cards[Math.floor(Math.random() * cards.length)].selected = "selected";
  $( "#newCard" ).trigger("change");
});

/* set card preview button to current card */
$( "#newCard" ).on("change", function() {
  $( "#previewCard" ).attr("href",
  $( this ).find(":selected").attr("data-preview")
  );
});

/* hide matching values from swap lists */
$( "#swapA" ).on("change", function() {
  var other = $('#swapB')
  other.children("option").hide()
  .not("option[value*='" + $(this).val() + "']").show();
  
  if (other.val() == $(this).val()) {
    if ($(this).val() == 0) { other.val(1); }
    else { other.val(+other.val() - 1); }
  }
});

$( "#swapB" ).on("change", function(ev) {
  var other = $('#swapA')
  other.children("option").hide()
  .not("option[value*='" + $(this).val() + "']").show();
  
  if (other.val() == $(this).val()) {
    if ($(this).val() == 0) { other.val(1); }
    else { other.val(+other.val() - 1); }
  }
});

/* initialize onChange listeners */
$(function() { 
  $( "#newCard" ).trigger("change");
  $(  "#swapA"  ).trigger("change");
  $(  "#swapB"  ).trigger("change");
});