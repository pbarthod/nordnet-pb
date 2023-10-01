var autocompleteResultContainerCpt = 0;

function autocompleteAdresse(cible, parent, type, submitButton, modalId) {
    autocompleteResultContainerCpt++;
    var autoCompleteResultContainerId = 'aucompleteResultContainer' + autocompleteResultContainerCpt;
    var elemDiv = document.createElement('div');
    $(elemDiv).attr('id', autoCompleteResultContainerId);

    if ('undefined' === typeof(modalId)) {
        modalId = null;
    }

    if ('undefined' === typeof(submitButton)) {
        submitButton = null;
    }

    if (null === modalId) {
        $(elemDiv).appendTo("body");
    }
    else {
        $(elemDiv).appendTo($('#' + modalId));
    }

    var url = $(parent).data('url-autocomplete');
    var clickItem = false;
    var clickNoResultFound = false;
    var minLengthForAutocomplete = 3;
    var launchAutocompleteOnClick = false;

    $(cible).on('keyup', function(){
        autocompleteManageSubMinchars(minLengthForAutocomplete, cible, parent, submitButton);
    });

    $(cible).on('paste', function(){
        // without timeout, we get length before paste
        setTimeout(function () {
            autocompleteManageSubMinchars(minLengthForAutocomplete, cible, parent, submitButton);
        }, 100);
    });
    
    $(cible).on('click', function(){
        if (launchAutocompleteOnClick) {
            $(cible).autocomplete('search');
        }
    });

    $(window).resize(function () {
        var resultObject = $('#' + autoCompleteResultContainerId + ' ul:first');
        if (resultObject.is(":visible")) {
            var offsetInput = $(cible).offset();
            resultObject.outerWidth(Math.max(resultObject.width("").outerWidth() + 1, $(cible).outerWidth()));

            var inputRealLeft = offsetInput.left;
            var inputRealTop = offsetInput.top;

            if (null !== modalId) {
                var modalOffset =  $('#' + modalId).offset();
                inputRealLeft = inputRealLeft - modalOffset.left;
                inputRealTop = inputRealTop - modalOffset.top;
            }

            resultObject.css('top', inputRealTop + $(cible).outerHeight()).css('left', inputRealLeft);
        }
     });

    $(cible).autocomplete({
        appendTo: '#' + autoCompleteResultContainerId,
        minLength: minLengthForAutocomplete,
        paramName: 'term',
        disabled: false,
        dialog: true,
        search: function(event, ui) {
            if (type == 'municipality' && $(parent + " #eligibilite_id_modal").length) {
                $(parent + " #eligibilite_id_modal").val('');
            } else if(type == 'geoloc' && $(parent + " #idAddok").length) {
                 $(parent + " #idAddok").val('');
            } else if (type !== 'arcep' && $(parent + " #eligibilite_id").length) {
                $(parent + " #eligibilite_id").val('');
            }

            var valueToSearch = trimForAutocomplete($(cible).val());
            if (valueToSearch.length < minLengthForAutocomplete) {
                event.preventDefault();
            }
            
            launchAutocompleteOnClick = false;
            clickItem = false;
            clickNoResultFound = false;

            if (null !== submitButton) {
                $(submitButton).prop('disabled', true);
            }
        },
        source: function(request, response) {
            $.ajax({
                url: url,
                dataType: 'json',
                data: {query: request.term, type: type},
                method: 'GET',
                success: function(data) {
                    var forceClassNotMunicipality = false;
                    if (1 === data.length) {
                        var onlyReturn = data[0];
                        if ('noResultFound' === onlyReturn.id) {
                            forceClassNotMunicipality = true;
                        }
                    }

                    if (forceClassNotMunicipality || (type !== 'municipality' && type !== 'adresseNoCity' && type !== 'arcep')) {
                        $('.ui-autocomplete').addClass('not-municipality');
                    } else {
                        $('.ui-autocomplete').removeClass('not-municipality');
                    }

                    response($.map(data, function(item) {
                        return item;
                    }));
                },
                error: function() {
                    $('#' + autoCompleteResultContainerId + ' ul:first').hide();
                    if($(parent + ' .invalid-feedback').length > 0) {
                        $(cible).removeClass('is-valid').addClass('is-invalid');
                        $(parent + ' .invalid-feedback').css('display', 'block').text('Une erreur est survenue. Merci de réessayer.');
                    } else {
                        $(cible).addClass('is-invalid').after('<div class="invalid-feedback">Une erreur est survenue. Merci de réessayer.</div>');
                        $(parent + ' .invalid-feedback').css('display', 'block');
                    }
                },
                complete: function() {
                    $(cible).removeClass("ui-autocomplete-loading");
                }
            });
        },
        open: function(event, ui) {
            clickItem = false;
            clickNoResultFound = false;

            if (null !== submitButton) {
                $(submitButton).prop('disabled', true);
            }
        },
        select: function(event, ui) {
            if(type == 'municipality') {
                // Si la recherche est faite depuis la modal pour la recherche à la ville
                $(parent + " #eligibilite_zipcode_modal").val(ui.item.zipcode);
                $(parent + " #eligibilite_city_modal").val(ui.item.city);
                $(parent + " #eligibilite_city_afnor_label_modal").val(ui.item.cityAfnorLabel);
                $(parent + " #eligibilite_city_alias_afnor_label_modal").val(ui.item.cityAliasAfnorLabel);
                $(parent + " #eligibilite_city_modal").val(ui.item.city);
                $(parent + " #eligibilite_insee_modal").val(ui.item.insee);
                $(parent + " #eligibilite_id_modal").val(ui.item.id);
                $(parent + " #eligibilite_type_modal").val(type);
            } else if(type == 'geoloc') {
                $(parent + " #idAddok").val(ui.item.id);
            } else if ('arcep' !== type) {
                // Si la recherche est faite depuis le formulaire d'éligibilité à l'adresse
                $(parent + " #eligibilite_zipcode").val(ui.item.zipcode);
                $(parent + " #eligibilite_city").val(ui.item.city);
                $(parent + " #eligibilite_city_afnor_label").val(ui.item.cityAfnorLabel);
                $(parent + " #eligibilite_city_alias_afnor_label").val(ui.item.cityAliasAfnorLabel);
                $(parent + " #eligibilite_insee").val(ui.item.insee);
                $(parent + " #eligibilite_id").val(ui.item.id);
                $(parent + " #eligibilite_buildingId").val('');
                $(parent + " #eligibilite_type").val(type);
            }

            // Si l'utilisateur ne trouve pas son adresse dans la proposition
            // On ouvre la modal pour le test d'éligibilité à la ville
            if(ui.item.label == 'Je ne trouve pas mon adresse, je saisis ma commune') {
                $('#modalEligibiliteVille').modal('show');
            } else {
                clickItem = true;
            }

            if('noResultFound' === ui.item.id) {
                clickNoResultFound = true;
                return false;
            } else {
                clickNoResultFound = false;
            }

            var bSelectIDontKnowMyAddress = (ui.item.idAddok === 'CITY');

            // on retire la class pour cacher le bloc d'autocomplétion
            $('.ui-autocomplete').removeClass('nonBlur');

            // Si le client ne choisi pas "Je ne trouve pas mon adresse"
            if (false === bSelectIDontKnowMyAddress) {
                // activer le bouton envoyer ici
                if ('geoloc' !== type && null !== submitButton) {
                    $(submitButton).prop("disabled", false);
                }
            } else{
                // TODO : Retiré le focus sur la cible
                if (type === 'geoloc') {
                    $('#modalGeolocVille').modal('show');
                }
                else {
                    $('#modalEligibiliteVille').modal('show');
                }

            }

            clickItem = true;
            // Sinon, on supprime le potentiel message d'erreur et on active le bouton
            $(cible).removeClass('is-invalid').addClass('is-valid');
            $(parent + ' .invalid-feedback').css('display', 'none');

            if (null !== submitButton) {
                $(submitButton).prop('disabled', false);
            }

            if ('arcep' === type) {
                locateAdressOnMapForArcep(ui.item.gps);
            }
        },
        close: function(event, ui) {
            var valueToSearch = trimForAutocomplete($(cible).val());

            if (clickItem == false && valueToSearch.length >= minLengthForAutocomplete) {
                $('#' + autoCompleteResultContainerId + ' ul:first').show();
                return false;
            }

            if (clickNoResultFound) {
                return false;
            }

            if($(cible).val() === 'Je ne trouve pas mon adresse, je saisis ma commune') {
                $(cible).val('');
            }

            if(clickItem == false) {
                if($(parent + ' .invalid-feedback').length > 0) {
                    $(cible).removeClass('is-valid').addClass('is-invalid');
                    $(parent + ' .invalid-feedback').css('display', 'block').text('Merci de sélectionner votre adresse parmi les choix proposés.');
                } else {
                    $(cible).addClass('is-invalid').after('<div class="invalid-feedback">Merci de sélectionner votre adresse parmi les choix proposés.</div>');
                    $(parent + ' .invalid-feedback').css('display', 'block');
                }

                if (null !== submitButton) {
                    $(submitButton).prop('disabled', true);
                }
            } else {
                $(cible).removeClass('is-invalid').addClass('is-valid');
                $(parent + ' .invalid-feedback').css('display', 'none');

                if (null !== submitButton) {
                    $(submitButton).prop('disabled', false);
                }
            }

            autocompleteManageSubMinchars(minLengthForAutocomplete, cible, parent, submitButton);
        }
    });

    // bug on chrome with autocomplete="off"
    var userAgent = navigator.userAgent.toLowerCase();
    if (/chrome/.test(userAgent)) {
        $(cible).attr("autocomplete", "reallyOff");
    }

    if ('geoloc' === type && '' !== $('#idAddok').val()) {
        $(submitButton).prop('disabled', false);
    } else if ('arcep' !== type && 'geoloc' !== type && (('' !== $(parent + " #eligibilite_id").val() && 'municipality' !== type) || ('' !== $(parent + " #eligibilite_id_modal").val() && 'municipality' === type))) {
        $(submitButton).prop('disabled', false);
    } else {
        var valueToSearch = trimForAutocomplete($(cible).val());
        if (valueToSearch.length >= minLengthForAutocomplete) {
            launchAutocompleteOnClick = true;
        }
    }

    return autoCompleteResultContainerId;
}

function autocompleteManageSubMinchars(minLengthForAutocomplete, cible, parent, submitButton) {
    if ($(cible).val().length < minLengthForAutocomplete) {
        $(parent + ' .invalid-feedback').css('display', 'none');
        if (null !== submitButton) {
            $(submitButton).prop('disabled', true);
        }
    }
}

function autocompleteAdresseCompleteForm(url, inputAddress, inputPostCode, inputCity)
{
    autocompleteResultContainerCpt++;
    var autoCompleteResultContainerId = 'aucompleteResultContainer' + autocompleteResultContainerCpt;
    var elemDiv = document.createElement('div');
    $(elemDiv).attr('id', autoCompleteResultContainerId);
    $(elemDiv).appendTo("body");

    var clickItem = false;
    var launchAutocompleteOnClick = false;
    
    inputAddress.on('click', function(){
        if (launchAutocompleteOnClick) {
            inputAddress.autocomplete('search');
        }
    });

    $(window).resize(function () {
        var resultObject = $('#' + autoCompleteResultContainerId + ' ul:first');
        if (resultObject.is(":visible")) {
            var offsetInput = inputAddress.offset();
            resultObject.outerWidth(Math.max(resultObject.width("").outerWidth() + 1, inputAddress.outerWidth()));
            resultObject.css('top', offsetInput.top + inputAddress.outerHeight()).css('left', offsetInput.left);
        }
    });

    inputAddress.autocomplete({
        appendTo: '#' + autoCompleteResultContainerId,
        minLength: 3,
        paramName: 'term',
        disabled: false,
        search: function(event, ui) {
            clickItem = false;
            launchAutocompleteOnClick = false;
            var valueToSearch = trimForAutocomplete(inputAddress.val());

            if (valueToSearch.length < 3) {
                event.preventDefault();
            }
        },
        source: function (request, response) {
            $.ajax({
                url: url,
                dataType: 'json',
                data: {query: request.term},
                method: 'GET',
                success: function(data) {
                    response($.map(data, function(item) {
                        return item;
                    }));
                }
            });
        },
        select: function(e, ui) {
            clickItem = true;
            if(ui.item.label == 'Je ne trouve pas mon adresse') {
                inputAddress.val(inputAddress.val());
                inputPostCode.removeAttr('readonly');
                inputCity.removeAttr('readonly');
                return false;
            } else {
                if(typeof ui.item.houseNumber !== 'undefined' && ui.item.houseNumber !== '' && ui.item.houseNumber !== null) {
                    inputAddress.val(ui.item.houseNumber + " " + ui.item.streetName);
                } else {
                    inputAddress.val(ui.item.streetName);
                }
                inputPostCode.attr('readonly','readonly');
                inputCity.attr('readonly','readonly');
                inputPostCode.val(ui.item.zipcode);
                inputCity.val(ui.item.city);
                return false;
            }
        },
        close: function(event, ui) {
            var valueToSearch = trimForAutocomplete(inputAddress.val());
            if (clickItem == false && valueToSearch.length >= 3) {
                $('#' + autoCompleteResultContainerId + ' ul:first').show();
                event.preventDefault();
                return false;
            }
        }
    });

    if (inputAddress.length) {
        var valueToSearch = trimForAutocomplete(inputAddress.val());
        if (valueToSearch.length >= 3) {
            launchAutocompleteOnClick = true;
        }
    }
}

function trimForAutocomplete(stringToTrim)
{
    stringToTrim = stringToTrim.replace(/^ +/, '');
    stringToTrim = stringToTrim.replace(/ +/g, ' ');
    return stringToTrim;
}

$(document).ready(function(){
    $('#modalEligibiliteVille').on('shown.bs.modal', function () {
        $('#eligibilite_adresse').val('');
        $('#eligibilite_save').prop('disabled', true);
        autocompleteAdresse('#commune-input', '#test-eligibility-form-modal', 'municipality', '#commune-homepage-test-eligibility-cta-top-modal', 'modalEligibiliteVille');
        $('#commune-input').click();
    });

    $('#modalEligibiliteVille').on('hide.bs.modal', function () {
        $('#modalEligibiliteVille .ui-autocomplete').hide();
        $('.modal-backdrop').remove();
        $('#eligible-form-commune').val('');
        $('#commune-homepage-test-eligibility-cta-top-modal').prop('disabled', true);
    });
});
