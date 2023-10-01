function toggleTssSubBlock() {
    $('.tss-sub-title').on('click', function () {

        if ($(this).hasClass('activated')) {
            $(this).siblings('.tss-sub-content').css('display', 'none');
            $(this).removeClass('activated');
        } else {
            $(this).siblings('.tss-sub-content').css('display', 'block');
            $(this).addClass('activated');
        }
    });
}

function scrollToAndtoggleTssBlock() {
    $('.scroll-to-link').on('click', function (e) {
        var linked = $(this).attr('href');
        if (!$(linked).hasClass('activated')) {
            $(linked).click();
        }
        gotoanchor($(this));
        e.preventDefault;
    });
}

function scrollToAndtoggleTssSubBlock() {
    $('.scroll-to-link-sub').on('click', function (e) {
        var linked = $(this).attr('href');
        getClickableParent(linked);
        gotoanchor($(this));
        e.preventDefault();
    });
}

function scrollToContent(value) {
    if(value != '') {
        value = value;
    } else {
        value = 70;
    }

    $('.scroll-to-content').click(function (e) {
        gotoanchor($(this), value);
        e.preventDefault();
    });
}

function gotoanchor(e, value) {
    if ($("#menu-fixed").length > 0) {
        if (!$("#menu-fixed").hasClass('affix-top')) {
            value = value || 70;
        } else {
            value = value * 2 || 140;
        }
    } else {
        value = value || 70;
    }

    $('html, body').animate({
        scrollTop: $(e.attr('href')).offset().top - value
    }, 1500);
}

function getClickableParent(anchor) {
    var clickable = $(anchor).closest('.tss-sub-content').siblings('.tss-sub-title');
    if (!clickable.hasClass('activated')) {
        clickable.click();
    }
    var parent = $('#tss-title');
    if (!parent.hasClass('activated')) {
        parent.click();
    }
}

function goToExternalTSS() {
    if (window.location.hash) {
        $('#tss-title').addClass('activated');
        $('#tss-content').show();
        var hash = window.location.hash,
            anchor = $(hash);
        anchor.addClass('activated');
        $(hash + ' + .tss-sub-content').css('display', 'block');
        $('html, body').animate({
            scrollTop: anchor.offset().top - 140
        }, 1500);
    }
}

function checkInputsRequired(parent, inputSubmit) {
    var isValid = true;

    $(parent + ' :input').filter('[required]').each(function() {
        if ($(this).val() === '') {
            $(inputSubmit).prop('disabled', true);
            isValid = false;
            return false;
        }
    });

    if(isValid) {
        $(inputSubmit).removeAttr('disabled');
    } else {
        $(inputSubmit).attr('disabled', 'disabled');
    }

    return isValid;
}

function customSelect(cible, classe) {

    $(cible).each(function () {
        var $this = $(this), numberOfOptions = $(this).children('option').length;
        $this.addClass('select-hidden');
        $this.wrap('<div class="select ' + classe + '"></div>');
        $this.after('<div class="select-styled"></div>');
        var $styledSelect = $this.next('div.select-styled');
        $styledSelect.html("<span>" + $this.children('option').eq(0).text() + "</span>");
        var $list = $('<ul />', {
            'class': 'select-options'
        }).insertAfter($styledSelect);
        for (var i = 0; i < numberOfOptions; i++) {
            $('<li />', {
                html: '<span>' + $this.children('option').eq(i).text() + '</span>',
                rel: $this.children('option').eq(i).val()
            }).appendTo($list);
        }

        var $listItems = $list.children('li');
        $styledSelect.click(function (e) {
            e.stopPropagation();
            $('div.select-styled.active').not(this).each(function () {
                $(this).removeClass('active').next('ul.select-options').hide();
            });
            $(this).toggleClass('active').next('ul.select-options').toggle();
        });
        $listItems.click(function (e) {
            e.stopPropagation();
            $styledSelect.html('<span>' + $(this).text() + '</span>').removeClass('active');
            $this.val($(this).attr('rel'));
            $list.hide();
        });
        $(document).click(function () {
            $styledSelect.removeClass('active');
            $list.hide();
        });
    });
}

function toggleFilled(e){
    if (e.val() != "") { e.addClass('filled'); } else { e.removeClass('filled') }
}

function removeAllSpaces(str) {
    return str.replace(/\s/g, "");
}
