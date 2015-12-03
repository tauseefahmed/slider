(function(factory){
  
  if (typeof define === 'function' && define.amd) {
      define(['jquery'], factory);
  } else if (typeof exports !== 'undefined') {
      module.exports = factory(require('jquery'));
  } else {
      factory(jQuery);
  }

})(function(jQuery){
  
  /*
	 * We define Zippy as a variable of type ‘function’. 
   * Here, we use an anonymous function to ensure 
   * that the logic inside the function is executed immediately. 
	 *
	 */
  var Zippy = (function(element, settings){
    
    var instanceUid = 0;
    
    /*
     * The constructor function for Zippy
     *
     */
    function _Zippy(element, settings){
      this.defaults = {
        slideDuration: '3000',
        speed: 500,
        arrowRight: '.arrow-right',
        arrowLeft: '.arrow-left'
      };
      
      // We create a new property to hold our default settings after they
      // have been merged with user supplied settings
      this.settings = jQuery.extend({},this,this.defaults,settings);
      
      // This object holds values that will change as the plugin operates
      this.initials = {
        currSlide : 0,
        jQuerycurrSlide: null,
        totalSlides : false,
        csstransitions: false
      };
      
      // Attaches the properties of this.initials as direct properties of Zippy
      jQuery.extend(this,this.initials);
      
      // Here we'll hold a reference to the DOM element passed in
      // by the jQuery.each function when this plugin was instantiated
      this.jQueryel = jQuery(element);
      
      // Ensure that the value of 'this' always references Zippy
      this.changeSlide = jQuery.proxy(this.changeSlide,this);
      
      // We'll call our initiator function to get things rolling!
      this.init();
      
      // A little bit of metadata about the instantiated object
      // This property will be incremented everytime a new Zippy carousel is created
		 // It provides each carousel with a unique ID
      this.instanceUid = instanceUid++;
    }
    
    return _Zippy;
  
  })();
  
  /**
	 * Called once per instance
	 * Calls starter methods and associate the '.zippy-carousel' class
	 * @params void
	 * @returns void
	 *
	 */
   Zippy.prototype.init = function(){
    //Test to see if cssanimations are available
    this.csstransitionsTest();
    // Add a class so we can style our carousel
    this.jQueryel.addClass('zippy-carousel');
    // Build out any DOM elements needed for the plugin to run
    // Eg, we'll create an indicator dot for every slide in the carousel
    this.build();
    // Eg. Let the user click next/prev arrows or indicator dots
    this.events();
    // Bind any events we'll need for the carousel to function
    this.activate();
    // Start the timer loop to control progression to the next slide
    this.initTimer();
  };
	
	/**
	 * Appropriated out of Modernizr v2.8.3
	 * Creates a new DOM element and tests existence of properties on it's
	 * Style object to see if CSSTransitions are available
	 * @params void
	 * @returns void
	 *
	 */
	Zippy.prototype.csstransitionsTest = function(){
		var elem = document.createElement('modernizr');
		//A list of properties to test for
		var props = ["transition","WebkitTransition","MozTransition","OTransition","msTransition"];
		//Iterate through our new element's Style property to see if these properties exist
		for ( var i in props ) {
			var prop = props[i];
			var result = elem.style[prop] !== undefined ? prop : false;
			if (result){
				this.csstransitions = result;
				break;
			} 
		} 
	};
	
	/**
	 * Add the CSSTransition duration to the DOM Object's Style property
	 * We trigger this function just before we want the slides to animate
	 * @params void
	 * @returns void
	 *
	 */
	Zippy.prototype.addCSSDuration = function(){
		var _ = this;
		this.jQueryel.find('.slide').each(function(){
			this.style[_.csstransitions+'Duration'] = _.settings.speed+'ms';
		});
	}
	
	/**
   * Remove the CSSTransition duration from the DOM Object's style property
   * We trigger this function just after the slides have animated
   * @params void
   * @returns void
   *
   */
	Zippy.prototype.removeCSSDuration = function(){
		var _ = this;
		this.jQueryel.find('.slide').each(function(){
			this.style[_.csstransitions+'Duration'] = '';
		});
	}
	
	/**
	 * Creates a list of indicators based on the amount of slides
	 * @params void
	 * @returns void
	 *
	 */ 
	Zippy.prototype.build = function(){
		var jQueryindicators = this.jQueryel.append('<ul class="indicators" >').find('.indicators');
		this.totalSlides = this.jQueryel.find('.slide').length;
		for(var i = 0; i < this.totalSlides; i++) jQueryindicators.append('<li data-index='+i+'>');
	};
	
	/**
	 * Activates the first slide
	 * Activates the first indicator
	 * @params void
	 * @returns void
	 *
	 */ 
	Zippy.prototype.activate = function(){
		this.jQuerycurrSlide = this.jQueryel.find('.slide').eq(0);
		this.jQueryel.find('.indicators li').eq(0).addClass('active');
	};
	
	/**
   * Associate event handlers to events
   * For arrow events, we send the placement of the next slide to the handler
   * @params void
   * @returns void
   *
   */
	Zippy.prototype.events = function(){
		jQuery('body')
			.on('click',this.settings.arrowRight,{direction:'right'},this.changeSlide)
			.on('click',this.settings.arrowLeft,{direction:'left'},this.changeSlide)
			.on('click','.indicators li',this.changeSlide);
	};
	
	/**
	 * TIMER
	 * Resets the timer
	 * @params void
	 * @returns void
	 *
	 */
	Zippy.prototype.clearTimer = function(){
		if (this.timer) clearInterval(this.timer);
	};
	
	/**
	 * TIMER
	 * Initialise the timer
	 * @params void
	 * @returns void
	 *
	 */
	Zippy.prototype.initTimer = function(){
		this.timer = setInterval(this.changeSlide, this.settings.slideDuration);
	};
	
	/**
	 * TIMER
	 * Start the timer
	 * Reset the throttle to allow changeSlide to be executable
	 * @params void
	 * @returns void
	 *
	 */
	Zippy.prototype.startTimer = function(){
		this.initTimer();
		this.throttle = false;
	};
	
	/**
	 * MAIN LOGIC HANDLER
	 * Triggers a set of subfunctions to carry out the animation
	 * @params	object	event
	 * @returns void
	 *
	 */
	Zippy.prototype.changeSlide = function(e){
		//Ensure that animations are triggered one at a time
		if (this.throttle) return;
		this.throttle = true;
		
		//Stop the timer as the animation is getting carried out
		this.clearTimer();
		
		// Returns the animation direction (left or right)
		var direction = this._direction(e);
		
		// Selects the next slide
		var animate = this._next(e,direction);
		if (!animate) return;
		
		//Active the next slide to scroll into view
		var jQuerynextSlide = this.jQueryel.find('.slide').eq(this.currSlide).addClass(direction + ' active');
		
    if (!this.csstransitions){
			this._jsAnimation(jQuerynextSlide,direction);
		} else {
			this._cssAnimation(jQuerynextSlide,direction);
		}
	};
	
	/**
	 * Returns the animation direction, right or left
	 * @params	object	event
	 * @returns strong	animation direction
	 *
	 */
	Zippy.prototype._direction = function(e){
		var direction;
		
		// Default to forward movement
		if (typeof e !== 'undefined'){
			direction = (typeof e.data === 'undefined' ? 'right' : e.data.direction);
		} else {
			direction = 'right';
		}
		return direction;
	};
	
	/**
	 * Updates our plugin with the next slide number
	 * @params	object	event
	 * @params	string	animation direction
	 * @returns boolean continue to animate?
	 *
	 */
	Zippy.prototype._next = function(e,direction){
		
    // If the event was triggered by a slide indicator, we store the data-index value of that indicator
		var index = (typeof e !== 'undefined' ? jQuery(e.currentTarget).data('index') : undefined);
		
		//Logic for determining the next slide
		switch(true){
			//If the event was triggered by an indicator, we set the next slide based on index
       case( typeof index !== 'undefined'):
				if (this.currSlide == index){
					this.startTimer();
					return false;
				} 
				this.currSlide = index;
			break;
			case(direction == 'right' && this.currSlide < (this.totalSlides - 1)):
				this.currSlide++;
			break;
			case(direction == 'right'):
				this.currSlide = 0;
			break;
			case(direction == 'left' && this.currSlide === 0):
				this.currSlide = (this.totalSlides - 1);
			break;
			case(direction == 'left'):
				this.currSlide--;
			break;
		}
		return true;
	};
	
	/**
	 * Executes the animation via CSS transitions
	 * @params	object	Jquery object the next slide to slide into view
	 * @params	string	animation direction
	 * @returns void
	 *
	 */
	Zippy.prototype._cssAnimation = function(jQuerynextSlide,direction){
    //Init CSS transitions
		setTimeout(function(){
			this.jQueryel.addClass('transition');
			this.addCSSDuration();
			this.jQuerycurrSlide.addClass('shift-'+direction);
		}.bind(this),100);
		
		//CSS Animation Callback
		//After the animation has played out, remove CSS transitions
		//Remove unnecessary classes
		//Start timer
		setTimeout(function(){
			this.jQueryel.removeClass('transition');
			this.removeCSSDuration();
			this.jQuerycurrSlide.removeClass('active shift-left shift-right');
			this.jQuerycurrSlide = jQuerynextSlide.removeClass(direction);
			this._updateIndicators();
			this.startTimer();
		}.bind(this),100 + this.settings.speed);
	};
	
	/**
	 * Executes the animation via JS transitions
	 * @params	object	Jquery object the next slide to slide into view
	 * @params	string	animation direction
	 * @returns void
	 *
	 */
	Zippy.prototype._jsAnimation = function(jQuerynextSlide,direction){
		//Cache this reference for use inside animate functions
		var _ = this;
		
     // See CSS for explanation of .js-reset-left
		if(direction == 'right') _.jQuerycurrSlide.addClass('js-reset-left');
		
     var animation = {};
		animation[direction] = '0%';
		
		var animationPrev = {};
		animationPrev[direction] = '100%';
		
		//Animation: Current slide
		this.jQuerycurrSlide.animate(animationPrev,this.settings.speed);
		
		//Animation: Next slide
		jQuerynextSlide.animate(animation,this.settings.speed,'swing',function(){
			//Get rid of any JS animation residue
			_.jQuerycurrSlide.removeClass('active js-reset-left').attr('style','');
			//Cache the next slide after classes and inline styles have been removed
			_.jQuerycurrSlide = jQuerynextSlide.removeClass(direction).attr('style','');
			_._updateIndicators();
			_.startTimer();
		});
	};
	
  /**
	 * Ensures the slide indicators are pointing to the currently active slide
	 * @params	void
	 * @returns	void
	 *
	 */
	Zippy.prototype._updateIndicators = function(){
		this.jQueryel.find('.indicators li').removeClass('active').eq(this.currSlide).addClass('active');
	};
	
	/**
	 * Initialize the plugin once for each DOM object passed to jQuery
	 * @params	object	options object
	 * @returns void
	 *
	 */
	jQuery.fn.Zippy = function(options){
    
    return this.each(function(index,el){
      
      el.Zippy = new Zippy(el,options);
      
    });
    
  };
  

});

// Custom options for the carousel
var args = {
	arrowRight : '.arrow-right', //A jQuery reference to the right arrow
	arrowLeft : '.arrow-left', //A jQuery reference to the left arrow
	speed : 1000, //The speed of the animation (milliseconds)
	slideDuration : 4000 //The amount of time between animations (milliseconds)
};

jQuery('.carousel').Zippy(args);
