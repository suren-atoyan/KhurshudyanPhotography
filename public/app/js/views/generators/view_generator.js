define(
[
  'jquery.mousewheel',
  'backbone',
  'underscore',
  'handlebars',
  'modernizr',
  'toucheffects',
  'require.text!tpl/gallery_generation_view.tpl',
],
function($, Backbone, _, Handlebars, Modernizr, Toucheffects, ViewTpl) {
  return {
    view: function(view_name, dom_elem) {
      console.log(view_name + ' view generation start!');
      console.time('generation');    
      
      return Backbone.View.extend({

        el: dom_elem,
        template: Handlebars.compile(ViewTpl),
        events: {
          'click .load_more': 'load_more_images',
          'click li a':       'zoom_image',
        },

        initialize: function() {
          var self = this;
          this.images_count;
          this.image_index = 1;
          this.images = [];
          this.end_flag = false;
          this.slider_index = 0;
          this.preload_index = 1;
          $.get("/get_images_count",
            {
              folder_name: view_name,
            },
            function(data) {
              self.images_count = data.img_count/2;
              self.load_more_images();
              self.$('.image_container').mousewheel(function(e, delta) {
                this.scrollLeft -= (delta * 30);
                e.preventDefault();
              });
              $(window).bind('resize', _.bind(self.updateCSS, self));
              self.updateCSS();
          });
        },

        render: function(img, image_index) {
          this.$('.image_container').append(this.template({
            image_index: image_index,
            view:        view_name,
          }));
          this.$(this.$('.image_container figure > div')[image_index - 1])
              .html(img);
        },

        preload_images: function() {
          var self = this;
          if($('body').data('active_view') == view_name && $('body').data('preload')) {
            if(this.preload_index <= this.images_count/2) {
              require(
              [
                'image!app/img/' + view_name + '/' + self.preload_index + '.jpg'
              ],
              function() {
                self.preload_index++;
                self.preload_images();
              });
            }
          }
        },

        load_more_images: function(e) {
          this.$('.load_more_section').hide();
          this.$('.preloader-anim').css('display', 'inline-block');;
          var self = this;
          var images_count;
          if (this.image_index + 10 <= this.images_count) {
            images_count = 10;
          } else {
            images_count = this.images_count - this.image_index;
          }
          self.images = [];
          for (var i = this.image_index; i < images_count + this.image_index; i++) {
            self.images.push('image!app/img/' + view_name + '/' + i + '.min.jpg');
          }
          if (self.images.length < 10) {
            self.end_flag = true;
          }
          requirejs(
          self.images,
          function(
            img_001, img_002, img_003, img_004, img_005,
            img_006, img_007, img_008, img_009, img_010
          ) {
            self.preload_images();
            var img_arr = arguments;
            for(var i = 0; i < img_arr.length; i++) {
              self.render(img_arr[i], self.image_index);
              self.image_index++;
            }
            Toucheffects();
            this.$('.load_more_section').css('display', 'inline-block');;
            this.$('.preloader-anim').hide();
            if (self.end_flag) {
              this.$('.load_more_section').hide();
            }
            $('#loading').fadeOut(500);
            $('#content').children().hide();
            self.$el.fadeIn(150);
          });
        },

        zoom_image: function(e) {
          $('#gallery #left_img').show();
          $('#gallery #right_img').show();
          // TODO: Optimizate image url "get" functionality
          var img_num = this.$(e.target).parents('figure')
                            .find('.image_index').attr('name');
          var img_src = 'app/img/' + view_name + '/' + img_num + '.jpg'
          $('#gallery').fadeIn(200);
          $('#gallery_img').attr('src', img_src);
          $(document).bind('keydown', _.bind(this.hide_gallery, this));
          $('#close_gallery').bind('click', _.bind(this.hide_gallery, this));
          // gallery events
          $('#gallery #left_img').bind('click', _.bind(this.get_left_slide, this));
          $('#gallery #right_img').bind('click', _.bind(this.get_right_slide, this));
          Backbone.history.navigate(view_name + '/' + img_num);
        },

        hide_gallery: function(e) {
          var key_code = e.keyCode || e.which;
          if(key_code == 27 || $(e.target).attr('id') == 'close_gallery') {
            $('#gallery').hide();
            $(document).off('keydown');
            $('#close_gallery').off('click');
            $('#gallery #left_img').off('click');
            $('#gallery #right_img').off('click');
          }
          if(key_code == 37) {
            $('#gallery #left_img').trigger('click');
          }
          if(key_code == 39) {
            $('#gallery #right_img').trigger('click'); 
          }
        },

        get_right_slide: function(e) {
          $('#gallery_preloader').fadeIn(110);
          var img = $(e.target).parent().find('img');
          var self = this;
          img.fadeOut(420, function() {
            if(self.slider_index < (self.images_count - 1)) {
              self.slider_index++;
              var img_url = 'app/img/' + view_name + '/' + self.slider_index + '.jpg';
              requirejs(
              [
                'image!' + img_url,
              ],
              function(test_img) {
                img.attr('src', img_url);
                $('#gallery_preloader').fadeOut(110);
                img.fadeIn(420);
                $('#gallery #left_img').show();
              });
            } else {
              img.attr('src', 'app/img/' + view_name + '/' + (self.images_count - 1) + '.jpg')
                .show();
              $(e.target).hide();
              $('#gallery_preloader').fadeOut(110);
            }
          });
        },

        get_left_slide: function(e) {
          $('#gallery_preloader').fadeIn(110);
          var img = $(e.target).parent().find('img');
          var self = this;
          img.fadeOut(420, function() {
            if(self.slider_index > 1) {
              self.slider_index--;
              var img_url = 'app/img/' + view_name + '/' + self.slider_index + '.jpg';
              requirejs(
              [
                'image!' + img_url,
              ],
              function(test_img) {
                img.attr('src', img_url);
                $('#gallery_preloader').fadeOut(110);
                img.fadeIn(420);
                $('#gallery #left_img').show();
              });
              img.attr('src', 'app/img/' + view_name + '/' + self.slider_index + '.jpg');
              img.fadeIn(420);
              $('#gallery #right_img').show();
            } else {
              img.attr('src', 'app/img/' + view_name + '/' + 1 + '.jpg')
                .show();
              $(e.target).hide();
              $('#gallery_preloader').fadeOut(110);
            }
          });
        },

        updateCSS: function() {
          var win_height  = $(window).height();
          var section_top = this.$('.image_container').css('top');
          if (win_height < 944) {
            var current_top = 50 - (944 - win_height)/22.5;
            this.$('.image_container').css('top', current_top + '%');
            if (win_height <= 600) {
              this.$('.image_container').css('margin-top', -82);
            } else {
              this.$('.image_container').css('margin-top', -200);
            }
          } else {
            this.$('.image_container').css('top', '50%');
          }
        },
      })
    }
  }
});
