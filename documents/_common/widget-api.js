jQuery.fn.acalogWidgetize = function (options) {
	var $elements = this;
	new AcalogWidgetAPI($elements, options, function (acalogWidgetAPI) {
		$elements.each(function () {
			acalogWidgetAPI.widgetize(jQuery(this));
		});
	});
	return this;
};
var AcalogWidgetAPI = (function ($) {
	'use strict';
	var Widgets = (function Widgets() {
		/**
		 * Converts the filter display options for the filter into a format the Widget API can use.
		 *
		 * @param {string} filterOptions JSON format of the filter display options.
		 * @return {Object} filterOptions JS object of the filter display options.
		 */
		function convertFilterOptions(filterOptions) {
			try {
				filterOptions = JSON.parse(filterOptions);
				filterOptions.program_display = Boolean(filterOptions.program_display);
				filterOptions.course_display = Boolean(filterOptions.course_display);
				filterOptions.program_show_only_active_visible = Boolean(filterOptions.program_show_only_active);
				filterOptions.searchable = Boolean(filterOptions.searchable);
				filterOptions.program_grouping = filterOptions.program_grouping === 2 ? 'degree-type' : filterOptions.program_grouping === 1 ? 'type' : 'none';
				filterOptions.course_grouping = filterOptions.course_grouping === 1 ? 'type' : 'none';
			} catch (e) {
				filterOptions = {};
				filterOptions.program_display = false;
				filterOptions.course_display = false;
				filterOptions.program_show_only_active_visible = true;
				filterOptions.searchable = false;
				filterOptions.program_grouping = 'none';
				filterOptions.course_grouping = 'none';
			}
			return filterOptions;
		}
		/**
		 * Gets the adhocs for the course and puts them into arrays based upon their position.
		 *
		 * @param {number} courseId The course id to get the adhocs for.
		 * @param {Array} adhocs The array of adhocs from the JSON API call.
		 * @return {Object} adhocs The array of adhocs split into positions.
		 */
		function getAdhocs(courseId, _adhocs) {
			var adhocs = {left: [], right: [], before: [], after: []};
			if (_adhocs.length) {
				for (var i = 0; i < _adhocs.length; i++) {
					var adhoc = _adhocs[i];
					if (courseId === adhoc['course-id']) {
						if (adhoc.placement === 'left') {
							adhocs.left.push(adhoc);
						} else if (adhoc.placement === 'right') {
							adhocs.right.push(adhoc);
						} else if (adhoc.placement === 'before') {
							adhocs.before.push(adhoc);
						} else if (adhoc.placement === 'after') {
							adhocs.after.push(adhoc);
						}
					}
				}
			}
			return adhocs;
		}
		/**
		 * Sorts the courses into groups based upon the course type.
		 * This function also filters out inactive courses.
		 *
		 * @param {Array} courses An array of the courses.
		 * @return {Array} groupedCourses An array of the courses grouped by the course type.
		 */
		function getCourseTypeGroupedCourses(courses) {
			var groupedCourses = [];
			var courseTypes = {};
			var courseType = '';
			for (var i = 0; i < courses.length; i++) {
				var course = courses[i];
				if (course.status.active === false) {
					continue;
				}
				if (course.course_types.length) {
					for (var j = 0; j < course.course_types.length; j++) {
						courseType = course.course_types[j].name;
						if (courseType in courseTypes) {
							courseTypes[courseType].push(course);
						} else {
							courseTypes[courseType] = [course];
						}
					}
				} else {
					courseType = 'Other Courses';
					if (courseType in courseTypes) {
						courseTypes[courseType].push(course);
					} else {
						courseTypes[courseType] = [course];
					}
				}
			}
			// todo
			var sortedCourseTypes = Object.keys(courseTypes).sort();
			if (sortedCourseTypes.indexOf('Other Courses') > -1) {
				sortedCourseTypes.splice(sortedCourseTypes.length, 0, sortedCourseTypes.splice(sortedCourseTypes.indexOf('Other Courses'), 1)[0]);
			}
			for (var k = 0; k < sortedCourseTypes.length; k++) {
				groupedCourses.push({
					'type': sortedCourseTypes[k],
					'courses': courseTypes[sortedCourseTypes[k]]
				});
			}
			return groupedCourses;
		}
		/**
		 * Gets an array of the courses with the inactive courses filtered out.
		 *
		 * @param {Array} courses An array of courses.
		 * @return {Array} ungroupedCourses An array of only active courses.
		 */
		function getUngroupedCourses(courses) {
			var ungroupedCourses = [];
			for (var i = 0; i < courses.length; i++) {
				var course = courses[i];
				if (course.status.active === false) {
					continue;
				}
				ungroupedCourses.push(course);
			}
			return ungroupedCourses;
		}
		/**
		 * Sorts the programs into groups based upon the program type.
		 * This function also filters out inactive and filters hidden programs if the program_show_only_active_visible
		 * option is passed in as part of the filterOptions argument
		 *
		 * @param {Array} programs An array of the programs.
		 * @param {Object} filterOptions A JS object of the filter display options.
		 * @return {Array} groupedPrograms An array of the programs grouped by the program type.
		 */
		function getProgramTypeGroupedPrograms(programs, filterOptions) {
			var groupedPrograms = [];
			var programTypes = {};
			var programType = '';
			for (var i = 0; i < programs.length; i++) {
				var program = programs[i];
				if ((filterOptions.program_show_only_active_visible && program.status.visible === false) || program.status.active === false) {
					continue;
				}
				if (program.program_types.length) {
					for (var j = 0; j < program.program_types.length; j++) {
						programType = program.program_types[j].name;
						if (programType in programTypes) {
							programTypes[programType].push(program);
						} else {
							programTypes[programType] = [program];
						}
					}
				} else {
					programType = 'Other Programs';
					if (programType in programTypes) {
						programTypes[programType].push(program);
					} else {
						programTypes[programType] = [program];
					}
				}
			}
			// todo
			var sortedProgramTypes = Object.keys(programTypes).sort();
			if (sortedProgramTypes.indexOf('Other Programs') > -1) {
				sortedProgramTypes.splice(sortedProgramTypes.length, 0, sortedProgramTypes.splice(sortedProgramTypes.indexOf('Other Programs'), 1)[0]);
			}
			for (var k = 0; k < sortedProgramTypes.length; k++) {
				groupedPrograms.push({
					'type': sortedProgramTypes[k],
					'programs': programTypes[sortedProgramTypes[k]]
				});
			}
			return groupedPrograms;
		}
		/**
		 * Sorts the programs into groups based upon the degree type.
		 * This function also filters out inactive and filters hidden programs is the program_show_only_active_visible
		 * option is passed in as part of the filterOptions argument
		 *
		 * @param {Array} programs An array of the programs.
		 * @param {Object} filterOptions A JS object of the filter display options.
		 * @return {Array} groupedPrograms An array of the programs groupped by the degree type.
		 */
		function getDegreeTypeGroupedPrograms(programs, filterOptions) {
			var groupedPrograms = [];
			var degreeTypes = {};
			var degreeType = '';
			for (var i = 0; i < programs.length; i++) {
				var program = programs[i];
				if ((filterOptions.program_show_only_active_visible && program.status.visible === false) || program.status.active === false) {
					continue;
				}
				if (program.degree_types.length) {
					for (var j = 0; j < program.degree_types.length; j++) {
						degreeType = program.degree_types[j].name;
						if (degreeType in degreeTypes) {
							degreeTypes[degreeType].push(program);
						} else {
							degreeTypes[degreeType] = [program];
						}
					}
				} else {
					degreeType = 'Other Programs';
					if (degreeType in degreeTypes) {
						degreeTypes[degreeType].push(program);
					} else {
						degreeTypes[degreeType] = [program];
					}
				}
			}
			// todo
			var sortedDegreeTypes = Object.keys(degreeTypes).sort();
			if (sortedDegreeTypes.indexOf('Other Programs') > -1) {
				sortedDegreeTypes.splice(sortedDegreeTypes.length, 0, sortedDegreeTypes.splice(sortedDegreeTypes.indexOf('Other Programs'), 1)[0]);
			}
			for (var k = 0; k < sortedDegreeTypes.length; k++) {
				groupedPrograms.push({
					'type': sortedDegreeTypes[k],
					'programs': degreeTypes[sortedDegreeTypes[k]]
				});
			}
			return groupedPrograms;
		}
		/**
		 * Gets an array of the programs with the inactive courses and hidden courses if the program_show_only_active_visible 
		 * option is passed in as part of the filterOptions argument filtered out.
		 *
		 * @param {Array} programs An array of the programs.
		 * @param {Object} filterOptions A JS object of the filter display options.
		 * @return {Array} ungroupedPrograms An array of only active programs.
		 */
		function getUngroupedPrograms(programs, filterOptions) {
			var ungroupedPrograms = [];
			for (var i = 0; i < programs.length; i++) {
				var program = programs[i];
				if ((filterOptions.program_show_only_active_visible && program.status.visible === false) || program.status.active === false) {
					continue;
				}
				ungroupedPrograms.push(program);
			}
			return ungroupedPrograms;
		}
		/**
		 * Renders a catalog.
		 *
		 * @param {Object} catalog The catalog to render.
		 * @param {Object} options Rendering options.
		 * @return {string} html The generated HTML.
		 */
		function renderCatalog(catalog, options) {
			var html = '';
			html += '<h1 class="acalog-catalog-name">' + catalog.name + '</h1>';
			html += '<div class="acalog-catalog-description">' + catalog.description + '</div>';
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a course
		 *
		 * @param {Object} course The course to render.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the course is loaded
		 * @return {string} html The generated HTML.
		 */
		function renderCourse(course, options) {
			var html = '';
			html += '<h1 class="acalog-course-title">' + course.title + '</h1>';
			if (course.hasOwnProperty('locations')) {
				const locations = course.locations.map(loc => loc.name).join(', ');
				if (locations.length > 0) {
					html += '<h3 class="acalog-course-location"><b>Location(s):</b><span>'+ locations + '</span></h3>';
				}
			}
			if (course.body) {
				html += '<div class="acalog-course-body">' + course.body + '</div>';
			} else {
				course.api = '/' + course.url.split('/').slice(3).join('/');
				html += '<div class="acalog-course-body" data-acalog-ajax="' + course.api + '" data-acalog-ajax-type="course-body">' + options.placeholder + '</div>';
			}
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a program.
		 *
		 * @param {Object} program The program to render.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderProgram(program, options) {
			var html = '';
			html += '<h1 class="acalog-program-name">' + program.name + '</h1>';
			if (program.hasOwnProperty('locations')) {
				const locations = program.locations.map(loc => loc.name).join(', ');
				if (locations.length > 0) {
					html += '<h3 class="acalog-program-location"><b>Location(s):</b><span>'+ locations + '</span></h3>';
				}
			}
			if (program.hasOwnProperty('description')) {
				html += '<div class="acalog-program-description">' + program.description + '</div>';
			} else {
				program.api = '/' + program.url.split('/').slice(3).join('/');
				html += '<div class="acalog-program-description" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="program">' + options.placeholder + '</div>';
			}
			if (program.hasOwnProperty('cores')) {
				html += '<div class="acalog-program-cores">' + renderCores(program.cores, 2, options) + '</div>';
			} else {
				program.api = '/' + program.url.split('/').slice(3).join('/');
				html += '<div class="acalog-program-cores" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="cores">' + options.placeholder + '</div>';
			}
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a list of cores.
		 *
		 * @param {Array} cores The cores to render.
		 * @param {number} index The header tag size for the core name.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderCores(cores, index, options) {
			var html = '';
			var coreHeading = index > 6 ? 6 : index;
			var courseHeading = coreHeading === 6 ? 6 : coreHeading + 1;
			for (var i = 0; i < cores.length; i++) {
				var core = cores[i];
				html += '<div class="acalog-program-core">';
					html += '<h' + coreHeading + ' class="acalog-program-core-name">' + core.name + '</h' + coreHeading + '>';
					if (core.description.length) {
						html += '<div class="acalog-program-core-description">' + core.description + '</div>';
					}
					if (core.courses.length) {
						html += '<ul class="acalog-program-core-courses">';
						for (var j = 0; j < core.courses.length; j++) {
							var course = core.courses[j];
							course.gateway = options.gateway + getGatewayURL('course', options.gatewayCatalogId, course['legacy-id']);
							course.api = '/' + course.url.split('/').slice(3).join('/');
							course.adhocs = getAdhocs(course.id, core.adhocs);
							for (var k = 0; k < course.adhocs.before.length; k++) {
								var adhocBefore = course.adhocs.before[k];
								html += adhocBefore.display;
							}
							html += '<li class="acalog-program-core-course">';
								for (var l = 0; l < course.adhocs.left.length; l++) {
									var adhocLeft = course.adhocs.left[l];
									html += adhocLeft.display + ' ';
								}
								html += '<a class="acalog-program-core-course-link" href="' + course.gateway + '">' + course.title + '</a>';
								for (var m = 0; m < course.adhocs.right.length; m++) {
									var adhocRight = course.adhocs.right[m];
									html += ' ' + adhocRight.display;
								}
								html += '<div class="acalog-program-core-course-container">';
									html += '<h' + courseHeading + ' class="acalog-program-core-course-title">' + course.title + '</h' + courseHeading + '>';
									html += '<div class="acalog-program-core-course-body" data-acalog-ajax="' + course.api + '" data-acalog-ajax-type="course-body">' + options.placeholder + '</div>';
									html += '<a href="#" class="acalog-close">Close</a>';
								html += '</div>';
							html += '</li>';
							for (var n = 0; n < course.adhocs.after.length; n++) {
								var adhocAfter = course.adhocs.after[n];
								html += adhocAfter.display;
							}
						}
						html += '</ul>';
					}
					if (core.children.length) {
						html += '<div class="acalog-program-cores">' + renderCores(core.children, index + 1, options) + '</div>';
					}
				html += '</div>';
			}
			return html;
		}
		/**
		 * Renders of list of programs.
		 *
		 * @param {Object} programs The programs to render.
		 * @param {Object} filterOptions A JS object of the filter display options.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderPrograms(programs, filterOptions, options) {
			var program;
			var html = '';
			if (filterOptions.program_grouping === 'type') {
				var programTypeGroupedPrograms = getProgramTypeGroupedPrograms(programs, filterOptions);
				if (programTypeGroupedPrograms.length) {
					html += '<h2>Programs</h2>';
					for (var i = 0; i < programTypeGroupedPrograms.length; i++) {
						html += '<h3>' + programTypeGroupedPrograms[i].type + '</h3>';
						html += '<ul>';
						for (var j = 0; j < programTypeGroupedPrograms[i].programs.length; j++) {
							program = programTypeGroupedPrograms[i].programs[j];
							program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
							html += '<li class="acalog-program">';
								html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
								program.api = '/' + program.url.split('/').slice(3).join('/');
								html += '<div class="acalog-program-container" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="program">';
									html += options.placeholder;
								html += '</div>';
							html += '</li>';
						}
						html += '</ul>';
					}
				}
			} else if (filterOptions.program_grouping === 'degree-type') {
				var degreeTypeGroupedPrograms = getDegreeTypeGroupedPrograms(programs, filterOptions);
				if (degreeTypeGroupedPrograms.length) {
					html += '<h2>Programs</h2>';
					for (var k = 0; k < degreeTypeGroupedPrograms.length; k++) {
						html += '<h3>' + degreeTypeGroupedPrograms[k].type + '</h3>';
						html += '<ul>';
						for (var l = 0; l < degreeTypeGroupedPrograms[k].programs.length; l++) {
							program = degreeTypeGroupedPrograms[k].programs[l];
							program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
							html += '<li class="acalog-program">';
								html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
								program.api = '/' + program.url.split('/').slice(3).join('/');
								html += '<div class="acalog-program-container" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="program">';
									html += options.placeholder;
								html += '</div>';
							html += '</li>';
						}
						html += '</ul>';
					}
				}
			} else {
				var ungroupedPrograms = getUngroupedPrograms(programs, filterOptions);
				if (ungroupedPrograms.length) {
					html += '<h2>Programs</h2>';
					html += '<ul>';
					for (var m = 0; m < ungroupedPrograms.length; m++) {
						program = ungroupedPrograms[m];
						program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
						html += '<li class="acalog-program">';
							html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
							program.api = '/' + program.url.split('/').slice(3).join('/');
							html += '<div class="acalog-program-container" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="program">';
								html += options.placeholder;
							html += '</div>';
						html += '</li>';
					}
					html += '</ul>';
				}
			}
			return html;
		}
		/**
		 * Renders a list of courses.
		 *
		 * @param {Object} courses The courses to render.
		 * @param {Object} filterOptions A JS option of the filter display options.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderCourses(courses, filterOptions, options) {
			var course;
			var html = '';
			if (courses.length) {
				if (filterOptions.course_grouping === 'type') {
					var courseTypeGroupedCourses = getCourseTypeGroupedCourses(courses);
					if (courseTypeGroupedCourses.length) {
						html += '<h2>Courses</h2>';
						for (var i = 0; i < courseTypeGroupedCourses.length; i++) {
							html += '<h3>' + courseTypeGroupedCourses[i].type + '</h3>';
							html += '<ul>';
							for (var j = 0; j < courseTypeGroupedCourses[i].courses.length; j++) {
								course = courseTypeGroupedCourses[i].courses[j];
								course.gateway = options.gateway + getGatewayURL('course', options.gatewayCatalogId, course['legacy-id']);
								html += '<li class="acalog-course">';
									html += '<a class="acalog-course-link" href="' + course.gateway + '">' + course.title + '</a>';
									html += '<div class="acalog-course-container">';
										html += renderCourse(course, options);
									html += '</div>';
								html += '</li>';
							}
							html += '</ul>';
						}
					}
				} else {
					var ungroupedCourses = getUngroupedCourses(courses);
					if (ungroupedCourses.length) {
						html += '<h2>Courses</h2>';
						html += '<ul>';
						for (var k = 0; k < ungroupedCourses.length; k++) {
							course = ungroupedCourses[k];
							course.gateway = options.gateway + getGatewayURL('course', options.gatewayCatalogId, course['legacy-id']);
							html += '<li class="acalog-course">';
								html += '<a class="acalog-course-link" href="' + course.gateway + '">' + course.title + '</a>';
								html += '<div class="acalog-course-container">';
									html += renderCourse(course, options);
								html += '</div>';
							html += '</li>';
						}
						html += '</ul>';
					}
				}
			}
			return html;
		}
		/**
		 * Renders an entity.
		 *
		 * @param {Object} entity The entity to render.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * 		program_display: Boolean to display programs or not
		 * 		course_display: Boolean to display courses or not
		 * @return {string} html The generated HTML.
		 */
		function renderEntity(entity, options) {
			// todo
			entity.options = convertFilterOptions(entity.options);
			var html = '';
			html += '<h1 class="acalog-entity-name">' + entity.name + '</h1>';
			html += '<div class="acalog-entity-description">' + entity.description + '</div>';
			if (entity.hasOwnProperty('programs') && entity.hasOwnProperty('options') && entity.options.program_display) {
				html += '<div class="acalog-entity-programs">' + renderPrograms(entity.programs, entity.options, options) + '</div>';
			} else if (entity.hasOwnProperty('options') && entity.options.program_display) {
				entity.api = '/' + entity.url.split('/').slice(3).join('/');
				html += '<div class="acalog-entity-programs" data-acalog-ajax="' + entity.api + '" data-acalog-ajax-type="programs">' + options.placeholder + '</div>';
			}
			if (entity.hasOwnProperty('courses') && entity.hasOwnProperty('options') && entity.options.course_display) {
				html += '<div class="acalog-entity-courses">' + renderCourses(entity.courses, entity.options, options) + '</div>';
			} else if (entity.hasOwnProperty('options') && entity.options.course_display) {
				entity.api = '/' + entity.url.split('/').slice(3).join('/');
				html += '<div class="acalog-entity-courses" data-acalog-ajax="' + entity.api + '" data-acalog-ajax-type="courses">' + options.placeholder + '</div>';
			}
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a filter.
		 *
		 * @param {Object} filter The filter to render.
		 * @param {Object} options Rendering options.
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderFilter(filter, options) {
			var temp = '<p>Full filter support coming soon. <a href="' + options.gateway + getGatewayURL('filter', options.gatewayCatalogId, filter['legacy-id']) + '">Click here</a> to view the filter.</p>';
			var html = '';
			html += '<h1 class="acalog-filter-name">' + filter.name + '</h1>';
			html += '<div class="acalog-filter-description">' + filter.content + '</div>';
			html += '<div class="acalog-filter-content">' + temp + '</div>';
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a custom page.
		 *
		 * @param {Object} page The custom page to render.
		 * @param {Object} options Rendering options.
		 * @return {string} html The generated HTML.
		 */
		function renderPage(page, options) {
			var html = '';
			html += '<h1 class="acalog-page-name">' + page.name + '</h1>';
			html += '<div class="acalog-page-description">' + page.content + '</div>';
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a degree planner.
		 * TODO: Update to render the degree planner, currently renders the program
		 *
		 * @param {Object} program The program to render the degree planner for.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderDegreePlanner(program, options) {
			var html = '';
			html += '<h1 class="acalog-program-name">' + program.name + '</h1>';
			html += '<div class="acalog-program-description">' + program.description + '</div>';
			if (program.hasOwnProperty('cores')) {
				html += '<div class="acalog-program-cores">' + renderCores(program.cores, 2, options) + '</div>';
			} else {
				program.api = '/' + program.url.split('/').slice(3).join('/');
				html += '<div class="acalog-program-cores" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="cores">' + options.placeholder + '</div>';
			}
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a list of degree planners.
		 * TODO: Update to render the degree planners, currently renders the list of programs
		 *
		 * @param {Object} programs The programs to render the degree planners for.
		 * @param {Object} filterOptions A JS object of the filter display options.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderDegreePlanners(programs, filterOptions, options) {
			var program;
			var html = '';
			if (filterOptions.program_grouping === 'type') {
				var programTypeGroupedPrograms = getProgramTypeGroupedPrograms(programs, filterOptions);
				if (programTypeGroupedPrograms.length) {
					html += '<h2>Programs</h2>';
					for (var i = 0; i < programTypeGroupedPrograms.length; i++) {
						html += '<h3>' + programTypeGroupedPrograms[i].type + '</h3>';
						html += '<ul>';
						for (var j = 0; j < programTypeGroupedPrograms[i].programs.length; j++) {
							program = programTypeGroupedPrograms[i].programs[j];
							program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
							html += '<li class="acalog-program">';
								html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
								html += '<div class="acalog-program-container">';
									html += renderDegreePlanner(program, options);
								html += '</div>';
							html += '</li>';
						}
						html += '</ul>';
					}
				}
			} else if (filterOptions.program_grouping === 'degree-type') {
				var degreeTypeGroupedPrograms = getDegreeTypeGroupedPrograms(programs, filterOptions);
				if (degreeTypeGroupedPrograms.length) {
					html += '<h2>Programs</h2>';
					for (var k = 0; k < degreeTypeGroupedPrograms.length; k++) {
						html += '<h3>' + degreeTypeGroupedPrograms[k].type + '</h3>';
						html += '<ul>';
						for (var l = 0; l < degreeTypeGroupedPrograms[k].programs.length; l++) {
							program = degreeTypeGroupedPrograms[k].programs[l];
							program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
							html += '<li class="acalog-program">';
								html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
								html += '<div class="acalog-program-container">';
									html += renderDegreePlanner(program, options);
								html += '</div>';
							html += '</li>';
						}
						html += '</ul>';
					}
				}
			} else {
				var ungroupedPrograms = getUngroupedPrograms(programs, filterOptions);
				if (ungroupedPrograms.length) {
					html += '<h2>Programs</h2>';
					html += '<ul>';
					for (var m = 0; m < ungroupedPrograms.length; m++) {
						program = ungroupedPrograms[m];
						program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
						html += '<li class="acalog-program">';
							html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
							html += '<div class="acalog-program-container">';
								html += renderDegreePlanner(program, options);
							html += '</div>';
						html += '</li>';
					}
					html += '</ul>';
				}
			}
			return html;
		}
		function renderLocation(location, options) {
			let html = '';
			html += '<span class="acalog-location-container"><h1 class="acalog-location-name">' + location.name + '</h1>';
			let address = location.address;
			let formattedAddress = addressFormatter.format({
				city: address.city,
				state: address.state,
				countryCode: address.country,
				postcode: address.postal_code,
				road: address.street,
				county: address.county,
				house: address.building_number,
				suite: address.suite,
			}, {
				output: 'array'
			});
			html += '<address class="acalog-location-address">' + formattedAddress.join('<br/>') + '</address>';
			html += '</span>';
			return html;
		}
		/**
		 * Gets the gateway URL for the types of widgets.
		 *
		 * @param {string} type Widget type to get the URL for.
		 * @param {number} catalogId The legacy ID of the catalog.
		 * @param {number} itemId The legacy ID of the item.
		 * @return {string} gatewayURL The gateway URL for the widget.
		 */
		function getGatewayURL(type, catalogId, itemId) {
			var gatewayURL = '';
			if (type === 'index') {
				gatewayURL += '/index.php?catoid=' + catalogId;
			} else if (type === 'course') {
				gatewayURL += '/preview_course_nopop.php?catoid=' + catalogId + '&coid=' + itemId;
			} else if (type === 'program') {
				gatewayURL += '/preview_program.php?catoid=' + catalogId + '&poid=' + itemId;
			} else if (type === 'entity') {
				gatewayURL += '/preview_entity.php?catoid=' + catalogId + '&ent_oid=' + itemId;
			} else if (type === 'filter') {
				gatewayURL += '/content.php?catoid=' + catalogId + '&navoid=' + itemId;
			} else if (type === 'page') {
				gatewayURL += '/content.php?catoid=' + catalogId + '&navoid=' + itemId;
			} else if (type === 'media') {
				gatewayURL += '/mime/media/view/' + catalogId + '/' + itemId + '/';
			} else if (type === 'degree_planner') {
				gatewayURL += '/preview_degree_planner.php?catoid=' + catalogId + '&poid=' + itemId + '&print'
			}
			return gatewayURL;
		}
		/**
		 * Calls the appropriate render functions and updates the element with the generated HTML.
		 *
		 * @param {Object} $element The element to update.
		 * @param {Object} options Rendering options.
		 * 		api: The URL for the Widget API
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * 		program_display: Boolean to display programs or not
		 * 		course_display: Boolean to display courses or not
		 * @return {void}
		 */
		function updateData($element, options, callback) {
			var endpoint = options.api + '/widget-api' + $element.data('acalog-ajax');
			var type = $element.data('acalog-ajax-type');
			$element.removeData('acalog-ajax');
			$element.removeAttr('data-acalog-ajax');
			$element.removeData('acalog-ajax-type');
			$element.removeAttr('data-acalog-ajax-type');
			var widgetType = Utilities.getWidgetType($element, options);
			Data.get(endpoint, [], widgetType, options, function (data, widgetType) {
				if (data.length) {
					data = data[0];
					if (type === 'course-body' && data.hasOwnProperty('body')) {
						$element.html(data.body);
					} else if (type === 'cores' && data.hasOwnProperty('cores')) {
						var cores = renderCores(data.cores, 2, options);
						$element.html(cores);
					} else if (type === 'programs' && data.hasOwnProperty('programs') && data.hasOwnProperty('options')) {
						// todo
						data.options = convertFilterOptions(data.options);
						var programs = renderPrograms(data.programs, data.options, options);
						$element.html(programs);
					} else if (type === 'courses' && data.hasOwnProperty('courses') && data.hasOwnProperty('options')) {
						// todo
						data.options = convertFilterOptions(data.options);
						var courses = renderCourses(data.courses, data.options, options);
						$element.html(courses);
					} else if (type === 'course') {
						var course = renderCourse(data, options);
						$element.html(course);
					} else if (type === 'program') {
						var program = renderProgram(data, options);
						$element.html(program);
					} else if (type === 'entity') {
						var entity = renderEntity(data, options);
						$element.html(entity);
					} else if (type === 'filter') {
						var filter = renderFilter(data, options);
						$element.html(filter);
					} else if (type === 'page') {
						var page = renderPage(data, options);
						$element.html(page);
					} else if (type === 'media') {
						$element.html('');
					} else if (type === 'degree_planner' && data.hasOwnProperty('programs') && data.hasOwnProperty('options')) {
						data.options = convertFilterOptions(data.options);
						var degree_planners = renderDegreePlanners(data.programs, data.options, options);
						$element.html(degree_planners);
					} else if (type === 'degree_planner') {
						var degree_planner = renderDegreePlanner(data, options);
						$element.html(degree_planner);
					} else if (type === 'location' || type === 'locations'){
						var location = renderLocation(data, options);
						$element.html(location);
					} else {
						$element.html('<span class="acalog-error">Error</span>');
					}
				} else {
					$element.html('<span class="acalog-error">Error</span>');
				}
				callback() ;
			});
		}
		/**
		 * Convert the permalink links from the JSON API into the correct format based upon the type.
		 *
		 * @param {Object} $element The element containing the permalinks.
		 * @param {Object} options Rendering options.
		 * 		api: The URL for the Widget API
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * 		program_display: Boolean to display programs or not
		 * 		course_display: Boolean to display courses or not
		 * @param {Boolean} nested Boolean if the permalink is nested inside of another permalink, used for inline permalinks.
		 * @return {void}
		 */
		function updatePermalinks($element, options, nested) {
			$element.find('.permalink').each(function () {
				var html = '';
				var permalink = $(this).data();
				permalink.display = $(this).text();
				if (permalink.to_type === 'hierarchy') {
					permalink.to_type = 'entity';
				} else if (permalink.to_type === 'content' && permalink.to_url.indexOf('page') !== -1) {
					permalink.to_type = 'page';
				} else if (permalink.to_type === 'content' && permalink.to_url.indexOf('media') !== -1) {
					permalink.to_type = 'media';
				} else if (permalink.to_type === 'content' && permalink.to_url.indexOf('filter') !== -1) {
					permalink.to_type = 'filter';
				} else if (permalink.to_type === 'content' && permalink.to_url.indexOf('direct-link') !== -1) {
					permalink.to_type = 'filter';
				}
				if (permalink.hasOwnProperty('to_url')) {
					permalink.api = '/' + permalink.to_url.split('/').slice(3).join('/');
				}
				permalink.gateway = options.gateway + getGatewayURL(permalink.to_type, options.gatewayCatalogId, permalink.to_legacy_id);
				if (permalink.anchor_text.length) {
					permalink.gateway += '#' + permalink.anchor_text;
				}
				if (permalink.inactive === true) {
					html += '<div class="acalog-permalink">';
						html += '<span class="acalog-permalink-inactive">' + permalink.display + '</span>';
					html += '</div>';
				} else if ($(this).is('img')) {
					// Copy the style attribute, if any, to the new element
					var styleAttr = '';
					if ($(this)[0].hasAttribute('style')){
						styleAttr=' style="'+ $(this)[0].style.cssText + '"'
					}
					html += '<img class="acalog-permalink" src="' + permalink.gateway + '"'+ styleAttr +'>';
				} else if (permalink.display_type === 'inline' && nested === true) {
					html += '<div class="acalog-permalink">';
						html += '<a target="_blank" class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
					html += '</div>';
				} else if (permalink.display_type === 'inline') {
					html += '<div class="acalog-permalink acalog-permalink-inline">';
						html += '<a class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
						html += '<div class="acalog-permalink-container' + (permalink.show_title ? '' : ' acalog-permalink-hidetitle') + '" data-acalog-ajax="' + permalink.api + '" data-acalog-ajax-type="' + permalink.to_type + '">' + options.placeholder + '</div>';
					html += '</div>';
				} else if (permalink.display_type === 'tooltip' && permalink.api != undefined) {
					html += '<div class="acalog-permalink acalog-permalink-tooltip">';
						html += '<a class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
						html += '<div class="acalog-permalink-container" data-acalog-ajax="' + permalink.api + '"  data-acalog-ajax-type="' + permalink.to_type + '">' + options.placeholder + '</div>';
					html += '</div>';
				} else if (permalink.display_type === 'dynamic' && permalink.api != undefined) {
					html += '<div class="acalog-permalink acalog-permalink-showhide">';
						html += '<a class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
						html += '<div class="acalog-permalink-container" data-acalog-ajax="' + permalink.api + '" data-acalog-ajax-type="' + permalink.to_type + '">' + options.placeholder + '</div>';
					html += '</div>';
				} else if (permalink.display_type === 'same') {
					html += '<div class="acalog-permalink">';
						html += '<a class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
					html += '</div>';
				} else if (permalink.display_type === 'new') {
					html += '<div class="acalog-permalink">';
						html += '<a target="_blank" class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
					html += '</div>';
				} else if (permalink.display_type === 'popup') {
					html += '<div class="acalog-permalink">';
						html += '<a target="_blank" class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
					html += '</div>';
				} else {
					html += '<div class="acalog-permalink">';
						html += '<span class="acalog-permalink-text">' + permalink.display + '</span>';
					html += '</div>';
				}
				$(this).replaceWith(html);
			});
			$element.find('.acalog-permalink-inline').each(function () {
				var $permalink = $(this);
				var $permalinkContainer = $(this).children('.acalog-permalink-container');
				$permalink.addClass('acalog-permalink-open');
				if ($permalinkContainer.attr('data-acalog-ajax')) {
					updateData($permalinkContainer, options, function () {
						updatePermalinks($permalinkContainer, options, true);
					});
				}
			});
			if (options.display === 'dynamic') {
				$element.on('click', '.acalog-permalink-tooltip > .acalog-permalink-link, .acalog-permalink-showhide > .acalog-permalink-link', function (event) {
					event.preventDefault();
					event.stopPropagation();
					var $permalink = $(this).parent();
					var $permalinkContainer = $permalink.children('.acalog-permalink-container');
					$permalink.toggleClass('acalog-permalink-open');
					if ($permalinkContainer.attr('data-acalog-ajax')) {
						updateData($permalinkContainer, options, function () {
							updatePermalinks($permalinkContainer, options, true);
						});
					}
				});
				$element.on('click', '.acalog-permalink .acalog-permalink-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-permalink-open');
				});
				$element.on('click', '.acalog-course > .acalog-course-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-course-open');
				});
				$element.on('click', '.acalog-program > .acalog-program-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-program-open');
				});
				$element.on('click', '.acalog-program-core-course > .acalog-program-core-course-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-program-core-course-open');
				});
				$element.on('click', '.acalog-entity > .acalog-entity-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-entity-open');
				});
				$element.on('click', '.acalog-filter > .acalog-filter-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-filter-open');
				});
				$element.on('click', '.acalog-page > .acalog-page-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-page-open');
				});
			}
		}
		/**
		 * Widget for the Catalog Content.
		 *
		 * @class CatalogContentWidget
		 * @constructor
		 */
		function CatalogContentWidget() {
			/**
			 * Renders the HTML for the catalog content type widget.
			 *
			 * @param {Array} catalogs The list to render the first catalog of.
			 * @param {Object} options Rendering options.
			 * @return {string} html The generated HTML.
			 */
			function renderHTML(catalogs, options) {
				var html = '';
				if (catalogs.length) {
					var catalog = catalogs[0];
					html += renderCatalog(catalog, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Call the function to render the widget and update the element with the HTML.
			 *
			 * @param {Object} $element The element to update.
			 * @param {Array} data The date for the catalog.
			 * @param {Object} options Rendering options.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'catalog-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
			};
		}
		/**
		 * Description.
		 *
		 * @class CatalogListWidget
		 * @constructor
		 */
		function CatalogListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} catalogs Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(catalogs, options) {
				var html = '';
				if (catalogs.length) {
					for (var i = 0; i < catalogs.length; i++) {
						var catalog = catalogs[i];
						catalog.gateway = options.gateway + getGatewayURL('index', catalog['legacy-id'], catalog['legacy-id']);
						html += '<li class="acalog-catalog">';
							html += '<a class="acalog-catalog-link" href="' + catalog.gateway + '">' + catalog.name + '</a>';
							html += '<div class="acalog-catalog-container">';
								html += renderCatalog(catalog, options);
							html += '</div>';
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-catalog">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'catalog-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
			};
		}
		/**
		 * Description.
		 *
		 * @class CatalogLinkWidget
		 * @constructor
		 */
		function CatalogLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('index', legacyItemId, legacyItemId);
					text = data[0].name;
				} else {
					Data.reportError(options.api, 'catalog-link', $element.prop('outerHTML'));
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class CourseContentWidget
		 * @constructor
		 */
		function CourseContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} course Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(courses, options) {
				var html = '';
				if (courses.length) {
					var course = courses[0];
					html += renderCourse(course, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'course-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
			};
		}
		/**
		 * Description.
		 *
		 * @class CourseListWidget
		 * @constructor
		 */
		function CourseListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} courses Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(courses, options) {
				var html = '';
				if (courses.length) {
					for (var i = 0; i < courses.length; i++) {
						var course = courses[i];
						course.gateway = options.gateway + getGatewayURL('course', options.gatewayCatalogId, course['legacy-id']);
						html += '<li class="acalog-course">';
							html += '<a class="acalog-course-link" href="' + course.gateway + '">' + course.title + '</a>';
							if (course.url) {
								course.api = '/' + course.url.split('/').slice(3).join('/');
								html += '<div class="acalog-course-container" data-acalog-ajax="' + course.api + '" data-acalog-ajax-type="course">';
									html += options.placeholder;
								html += '</div>';
							} else {
								html += '<div class="acalog-course-container">';
									html += renderCourse(course, options);
								html += '</div>';
							}
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-course">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'course-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-course-open');
						var $course_body = $(this).next('div.acalog-course-container');
						if ($course_body.data('acalog-ajax')) {
							updateData($course_body, options, function() {
								updatePermalinks($course_body, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class CourseLinkWidget
		 * @constructor
		 */
		function CourseLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('course', options.gatewayCatalogId, legacyItemId);
					text = data[0].title;
				} else {
					Data.reportError(options.api, 'course-link', $element.prop('outerHTML'));
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class ProgramContentWidget
		 * @constructor
		 */
		function ProgramContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} program Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(programs, options) {
				var html = '';
				if (programs.length) {
					var program = programs[0];
					html += renderProgram(program, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'program-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				var $cores = $element.children('.acalog-program-cores');
				if ($cores.attr('data-acalog-ajax')) {
					updateData($cores, options, function () {
						updatePermalinks($cores, options, false);
					});
				}
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-program-core-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-core-course-open');
						var $courseBody = $(this).siblings('.acalog-program-core-course-container:first').children('.acalog-program-core-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class ProgramListWidget
		 * @constructor
		 */
		function ProgramListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} programs Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(programs, options) {
				var html = '';
				if (programs.length) {
					for (var i = 0; i < programs.length; i++) {
						var program = programs[i];
						program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
						html += '<li class="acalog-program">';
							html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
							if (program.url) {
								program.api = '/' + program.url.split('/').slice(3).join('/');
								html += '<div class="acalog-program-container" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="program">';
									html += options.placeholder;
								html += '</div>';
							} else {
								html += '<div class="acalog-program-container">';
									html += renderProgram(program, options);
								html += '</div>';
							}
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-program">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'program-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-program-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-open');
						var $program_body = $(this).next('div.acalog-program-container');
						if ($program_body.data('acalog-ajax')) {
							updateData($program_body, options, function() {
								updatePermalinks($program_body, options, false);
							});
						}
					});
					$element.on('click', '.acalog-program-core-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-core-course-open');
						var $courseBody = $(this).next('.acalog-program-core-course-container').children('.acalog-program-core-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class ProgramLinkWidget
		 * @constructor
		 */
		function ProgramLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('program', options.gatewayCatalogId, legacyItemId);
					text = data[0].name;
				} else {
					Data.reportError(options.api, 'program-link', $element.prop('outerHTML'));
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class EntityContentWidget
		 * @constructor
		 */
		function EntityContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} entities Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(entities, options) {
				var html = '';
				if (entities.length) {
					var entity = entities[0];
					html += renderEntity(entity, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'entity-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				var $programs = $element.children('.acalog-entity-programs');
				if ($programs.attr('data-acalog-ajax')) {
					updateData($programs, options, function () {
						updatePermalinks($programs, options, false);
					});
				}
				var $courses = $element.children('.acalog-entity-courses');
				if ($courses.attr('data-acalog-ajax')) {
					updateData($courses, options, function () {
						updatePermalinks($courses, options, false);
					});
				}
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-course-open');
						var $courseBody = $(this).next('.acalog-course-container').children('.acalog-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
					$element.on('click', '.acalog-program-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-open');
						var $program = $(this).next('.acalog-program-container');
						if ($program.attr('data-acalog-ajax')) {
							updateData($program, options, function () {
								updatePermalinks($program, options, false);
							});
						}
						var $cores = $(this).next('.acalog-program-container').children('.acalog-program-cores');
						if ($cores.attr('data-acalog-ajax')) {
							updateData($cores, options, function () {
								updatePermalinks($cores, options, false);
							});
						}
					});
					$element.on('click', '.acalog-program-core-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-core-course-open');
						var $courseBody = $(this).next('.acalog-program-core-course-container').children('.acalog-program-core-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class EntityListWidget
		 * @constructor
		 */
		function EntityListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} entities Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(entities, options) {
				var html = '';
				if (entities.length) {
					for (var i = 0; i < entities.length; i++) {
						var entity = entities[i];
						entity.gateway = options.gateway + getGatewayURL('entity', options.gatewayCatalogId, entity['legacy-id']);
						html += '<li class="acalog-entity">';
							html += '<a class="acalog-entity-link" href="' + entity.gateway + '">' + entity.name + '</a>';
							if (entity.url) {
								entity.api = '/' + entity.url.split('/').slice(3).join('/');
								html += '<div class="acalog-entity-container" data-acalog-ajax="' + entity.api + '" data-acalog-ajax-type="entity">';
									html += options.placeholder;
								html += '</div>';
							} else {
								html += '<div class="acalog-entity-container">';
									html += renderEntity(entity, options);
								html += '</div>';
							}
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-page">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'entity-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-entity-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-entity-open');
						var $entity_body = $(this).next('div.acalog-entity-container');
						if ($entity_body.data('acalog-ajax')) {
							updateData($entity_body, options, function() {
								updatePermalinks($entity_body, options, false);
							});
						}
						var $programs = $(this).next('.acalog-entity-container').children('.acalog-entity-programs');
						if ($programs.attr('data-acalog-ajax')) {
							updateData($programs, options, function () {
								updatePermalinks($programs, options, false);
							});
						}
						var $courses = $(this).next('.acalog-entity-container').children('.acalog-entity-courses');
						if ($courses.attr('data-acalog-ajax')) {
							updateData($courses, options, function () {
								updatePermalinks($courses, options, false);
							});
						}
					});
					$element.on('click', '.acalog-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-course-open');
						var $courseBody = $(this).next('.acalog-course-container').children('.acalog-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
					$element.on('click', '.acalog-program-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-open');
						var $program = $(this).next('.acalog-program-container');
						if ($program.attr('data-acalog-ajax')) {
							updateData($program, options, function () {
								updatePermalinks($program, options, false);
							});
						}
						var $cores = $(this).next('.acalog-program-container').children('.acalog-program-cores');
						if ($cores.attr('data-acalog-ajax')) {
							updateData($cores, options, function () {
								updatePermalinks($cores, options, false);
							});
						}
					});
					$element.on('click', '.acalog-program-core-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-core-course-open');
						var $courseBody = $(this).next('.acalog-program-core-course-container').children('.acalog-program-core-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class EntityLinkWidget
		 * @constructor
		 */
		function EntityLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('entity', options.gatewayCatalogId, legacyItemId);
					text = data[0].name;
				} else {
					Data.reportError(options.api, 'entity-link', $element.prop('outerHTML'));
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class FilterContentWidget
		 * @constructor
		 */
		function FilterContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} filters Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(filters, options) {
				var html = '';
				if (filters.length) {
					var filter = filters[0];
					html += renderFilter(filter, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'filter-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
			};
		}
		/**
		 * Description.
		 *
		 * @class FilterListWidget
		 * @constructor
		 */
		function FilterListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} filters Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(filters, options) {
				var html = '';
				if (filters.length) {
					for (var i = 0; i < filters.length; i++) {
						var filter = filters[i];
						filter.gateway = options.gateway + getGatewayURL('filter', options.gatewayCatalogId, filter['legacy-id']);
						html += '<li class="acalog-filter">';
							html += '<a class="acalog-filter-link" href="' + filter.gateway + '">' + filter.name + '</a>';
							if (filter.url) {
								filter.api = '/' + filter.url.split('/').slice(3).join('/');
								html += '<div class="acalog-filter-container" data-acalog-ajax="' + filter.api + '" data-acalog-ajax-type="filter">';
									html += options.placeholder;
								html += '</div>';
							} else {
								html += '<div class="acalog-filter-container">';
									html += renderFilter(filter, options);
								html += '</div>';
							}
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-page">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'filter-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-filter-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-filter-open');
						var $filter_body = $(this).next('div.acalog-filter-container');
						if ($filter_body.data('acalog-ajax')) {
							updateData($filter_body, options, function() {
								updatePermalinks($filter_body, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class FilterLinkWidget
		 * @constructor
		 */
		function FilterLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('filter', options.gatewayCatalogId, legacyItemId);
					text = data[0].name;
				} else {
					Data.reportError(options.api, 'filter-link', $element.prop('outerHTML'));
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class PageContentWidget
		 * @constructor
		 */
		function PageContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} pages Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(pages, options) {
				var html = '';
				if (pages.length) {
					var page = pages[0];
					html += renderPage(page, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'page-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
			};
		}
		/**
		 * Description.
		 *
		 * @class PageListWidget
		 * @constructor
		 */
		function PageListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} pages Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(pages, options) {
				var html = '';
				if (pages.length) {
					for (var i = 0; i < pages.length; i++) {
						var page = pages[i];
						page.gateway = options.gateway + getGatewayURL('page', options.gatewayCatalogId, page['legacy-id']);
						html += '<li class="acalog-page">';
							html += '<a class="acalog-page-link" href="' + page.gateway + '">' + page.name + '</a>';
							if (page.url) {
								page.api = '/' + page.url.split('/').slice(3).join('/');
								html += '<div class="acalog-page-container" data-acalog-ajax="' + page.api + '" data-acalog-ajax-type="page">';
									html += options.placeholder;
								html += '</div>';
							} else {
								html += '<div class="acalog-page-container">';
									html += renderPage(page, options);
								html += '</div>';
							}
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-page">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'page-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-page-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-page-open');
						var $page_body = $(this).next('div.acalog-page-container');
						if ($page_body.data('acalog-ajax')) {
							updateData($page_body, options, function() {
								updatePermalinks($page_body, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class PageLinkWidget
		 * @constructor
		 */
		function PageLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('page', options.gatewayCatalogId, legacyItemId);
					text = data[0].name;
				} else {
					Data.reportError(options.api, 'page-link', $element.prop('outerHTML'));
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class DegreePlannerContentWidget
		 * @constructor
		 */
		function DegreePlannerContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} program Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(programs, options) {
				var html = '';
				if (programs.length) {
					var program = programs[0];
					html += renderDegreePlanner(program, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'degree-planner-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				var $cores = $element.children('.acalog-program-cores');
				if ($cores.attr('data-acalog-ajax')) {
					updateData($cores, options, function () {
						updatePermalinks($cores, options, false);
					});
				}
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-program-core-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-core-course-open');
						var $courseBody = $(this).next('.acalog-program-core-course-container').children('.acalog-program-core-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class DegreePlannerListWidget
		 * @constructor
		 */
		function DegreePlannerListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} programs Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(programs, options) {
				var html = '';
				if (programs.length) {
					for (var i = 0; i < programs.length; i++) {
						var program = programs[i];
						program.gateway = options.gateway + getGatewayURL('degree_planner', options.gatewayCatalogId, program['legacy-id']);
						html += '<li class="acalog-program">';
							html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
							html += '<div class="acalog-program-container">';
								html += renderDegreePlanner(program, options);
							html += '</div>';
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-program">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'degree-planner-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-program-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-open');
						var $cores = $(this).next('.acalog-program-container').children('.acalog-program-cores');
						if ($cores.attr('data-acalog-ajax')) {
							updateData($cores, options, function () {
								updatePermalinks($cores, options, false);
							});
						}
					});
					$element.on('click', '.acalog-program-core-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-core-course-open');
						var $courseBody = $(this).next('.acalog-program-core-course-container').children('.acalog-program-core-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class DegreePlannerLinkWidget
		 * @constructor
		 */
		function DegreePlannerLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('degree_planner', options.gatewayCatalogId, legacyItemId);
					text = data[0].name;
				} else {
					Data.reportError(options.api, 'degree-planner-link', $element.prop('outerHTML'));
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class LocationContentWidget
		 * @constructor
		 */
		function LocationContentWidget() {
			/**
			 *
			 * @param locations
			 * @param options
			 * @returns {string}
			 */
			function renderHTML(locations, options) {
				var html = '';
				let location = locations;
				if (locations.length) {
					location = locations[0].location;
				}
				html  += renderLocation(location, options);
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'location-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html );
			}
		}
		/**
		 * Description.
		 *
		 * @class LocationListWidget
		 * @constructor
		 */
		function LocationListWidget() {
			/**
			 *
			 * @param locations
			 * @param options
			 * @returns {string}
			 */
			function renderHTML(locations, options) {
				debugger;
				var html = '';
				let location = locations;
				if (!locations.length) {
					location = [locations];
				}
				if (locations.length) {
					for  ( let i = 0; i < locations.length; i++){
						let location = locations[i];
						if (location.location){
							location=location.location;
						}
						html  += renderLocation(location, options);
					}
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'location-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
			}
		}
		/**
		 * Description.
		 *
		 * @class UnknownContentWidget
		 * @constructor
		 */
		function UnknownContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				Data.reportError(options.api, 'unknown-content', $element.prop('outerHTML'));
				$element.html('<span class="acalog-error">Error</span>');
			};
		}
		/**
		 * Description.
		 *
		 * @class UnknownListWidget
		 * @constructor
		 */
		function UnknownListWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				Data.reportError(options.api, 'unknown-list', $element.prop('outerHTML'));
				$element.html('<li><span class="acalog-error">Error</span></li>');
			};
		}
		/**
		 * Description.
		 *
		 * @class UnknownLinkWidget
		 * @constructor
		 */
		function UnknownLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				Data.reportError(options.api, 'unknown-link', $element.prop('outerHTML'));
				$element.text('Error');
			};
		}
		return {
			CatalogContentWidget: CatalogContentWidget,
			CatalogListWidget: CatalogListWidget,
			CatalogLinkWidget: CatalogLinkWidget,
			CourseContentWidget: CourseContentWidget,
			CourseListWidget: CourseListWidget,
			CourseLinkWidget: CourseLinkWidget,
			ProgramContentWidget: ProgramContentWidget,
			ProgramListWidget: ProgramListWidget,
			ProgramLinkWidget: ProgramLinkWidget,
			EntityContentWidget: EntityContentWidget,
			EntityListWidget: EntityListWidget,
			EntityLinkWidget: EntityLinkWidget,
			FilterContentWidget: FilterContentWidget,
			FilterListWidget: FilterListWidget,
			FilterLinkWidget: FilterLinkWidget,
			PageContentWidget: PageContentWidget,
			PageListWidget: PageListWidget,
			PageLinkWidget: PageLinkWidget,
			DegreePlannerContentWidget: DegreePlannerContentWidget,
			DegreePlannerListWidget: DegreePlannerListWidget,
			DegreePlannerLinkWidget: DegreePlannerLinkWidget,
			LocationContentWidget: LocationContentWidget,
			LocationListWidget: LocationListWidget,
			UnknownContentWidget: UnknownContentWidget,
			UnknownListWidget: UnknownListWidget,
			UnknownLinkWidget: UnknownLinkWidget,
		};
	})();
	var Data = (function Data() {
		/**
		 * Description.
		 *
		 * @param {string} data Description.
		 * @return {string} data Description.
		 */
		function encodeData(data) {
			return encodeURIComponent(data).replace(/\-/g, '%2D').replace(/\_/g, '%5F').replace(/\./g, '%2E').replace(/\!/g, '%21').replace(/\~/g, '%7E').replace(/\*/g, '%2A').replace(/\'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
		}
		/**
		 * Description.
		 *
		 * @param {string} url Description.
		 * @return {string} url Description.
		 */
		function nextPage(url) {
			var match = url.match(/&page=(\d+)/);
			var pattern = match[0];
			var replacement = '&page=' + (parseInt(match[1]) + 1);
			return url.replace(pattern, replacement);
		}
		var _idName = {
			'course-content': 'courseId',
			'program-content': 'programId',
			'entity-content': 'entityId',
			'filter-content': 'filterId',
			'page-content': 'pageId',
			'degree-planner-content': 'programId',
			'location-content': 'locationId',
		};
		/**
		 * Description.
		 *
		 * @param {string} endpoint Description.
		 * @param {Array} data Description.
		 * @return {Array} data Description.
		 */
		function get(endpoint, _data, widgetType, options, callback) {
			$.ajax({
				url: endpoint
			}).done(function (data) {
				// todo
				if (typeof data.count !== 'undefined') {
					Object.keys(data).forEach(function (key) {
						if (key.indexOf('-list') > -1){
							data.list = data[key];
							delete data[key];
						}
					});
				}
				if (typeof data.count !== 'undefined' && typeof data.list !== 'undefined') {
					_data = _data.concat(data.list);
					if (data.count > _data.length && widgetType.indexOf('list') >= 0) {
						var nextEndpoint = nextPage(endpoint);
						get(nextEndpoint, _data, widgetType, options, callback);
					} else if (_data.length > 0 && widgetType.indexOf('content') >= 0 && endpoint.indexOf('page-size') >= 0) {
						var contentOptions = $.extend(true, {}, options);
						contentOptions[_idName[widgetType]] = _data[0]['id'];
						var contentEndpoint = Utilities.getEndpoint(contentOptions);
						get(contentEndpoint, [], widgetType, contentOptions, callback);
					} else {
						callback(_data, widgetType);
					}
				} else {
					_data.push(data);
					callback(_data, widgetType);
				}
			}).fail(function (jqXHR, textStatus, errorThrown) {
				callback([], widgetType);
			});
		}
		/**
		 * Description.
		 *
		 * @param {Array} data Description.
		 * @param {Object} options Description.
		 * @return {Array} data Description.
		 */
		function fauxFilterData(data, options) {
			if (data.length === 0) {
				return data;
			}
			if (options.data === 'catalogs') {
				for (var catalogIndex = 0; catalogIndex < data.length; catalogIndex++) {
					var catalog = data[catalogIndex];
					if (options.catalogId && catalog.id !== options.catalogId) {
						delete data[catalogIndex];
					}
					if (options.gatewayCatalogId && catalog['legacy-id'] !== options.gatewayCatalogId) {
						delete data[catalogIndex];
					}
				}
				data = data.filter(function(val){return val;});
			}
			return data;
		}
		/**
		 * Description.
		 *
		 * @param {string} api Description.
		 * @param {string} widget Description.
		 * @param {string} error Description.
		 * @return {void}
		 */
		function reportError(api, error, widget) {
			var data = {
				error: error,
				widget: widget,
				location: window.location.href
			};
			$.post(api + '/widget-api/error/', data);
		}
		return {
			encodeData: encodeData,
			get: get,
			fauxFilterData: fauxFilterData,
			reportError: reportError
		};
	})();
	var Utilities = (function() {
		/**
		 * Description.
		 *
		 * @param {Object} options Description.
		 * @return {string} endpoint Description.
		 */
		function getEndpoint(options) {
			var endpoint = options.api + '/widget-api';
			if (options.data === 'catalogs') {
				endpoint += '/catalogs/?page-size=100&page=1';
				if (options.catalogLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.catalogLegacyId);
				}
				if (options.catalogType) {
					endpoint += '&type=' + Data.encodeData(options.catalogType);
				}
				if (options.catalogName) {
					endpoint += '&name=' + Data.encodeData(options.catalogName);
				}
			} else if (options.data === 'courses' && options.courseId) {
				endpoint += '/catalog/' + options.catalogId + '/course/' + options.courseId + '/';
			} else if (options.data === 'courses') {
				endpoint += '/catalog/' + options.catalogId + '/courses/?page-size=100&page=1';
				if (options.courseLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.courseLegacyId);
				}
				if (options.courseType) {
					endpoint += '&type=' + Data.encodeData(options.courseType);
				}
				if (options.coursePrefix) {
					endpoint += '&prefix=' + Data.encodeData(options.coursePrefix);
				}
				if (options.courseCode) {
					endpoint += '&code=' + Data.encodeData(options.courseCode);
				}
				if (options.courseName) {
					endpoint += '&name=' + Data.encodeData(options.courseName);
				}
			} else if (options.data === 'programs' && options.programId) {
				endpoint += '/catalog/' + options.catalogId + '/program/' + options.programId + '/';
			} else if (options.data === 'programs') {
				endpoint += '/catalog/' + options.catalogId + '/programs/?page-size=100&page=1';
				if (options.programLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.programLegacyId);
				}
				if (options.programType) {
					endpoint += '&type=' + Data.encodeData(options.programType);
				}
				if (options.programDegreeType) {
					endpoint += '&degree-type=' + Data.encodeData(options.programDegreeType);
				}
				if (options.programCode) {
					endpoint += '&code=' + Data.encodeData(options.programCode);
				}
				if (options.programName) {
					endpoint += '&name=' + Data.encodeData(options.programName);
				}
			} else if (options.data === 'entities' && options.entityId) {
				endpoint += '/catalog/' + options.catalogId + '/hierarchy/' + options.entityId + '/';
			} else if (options.data === 'entities') {
				endpoint += '/catalog/' + options.catalogId + '/hierarchies/?page-size=100&page=1';
				if (options.entityLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.entityLegacyId);
				}
				if (options.entityType) {
					endpoint += '&type=' + Data.encodeData(options.entityType);
				}
				if (options.entityName) {
					endpoint += '&name=' + Data.encodeData(options.entityName);
				}
			} else if (options.data === 'filters' && options.filterId) {
				endpoint += '/catalog/' + options.catalogId + '/filter/' + options.filterId + '/';
			} else if (options.data === 'filters') {
				endpoint += '/catalog/' + options.catalogId + '/filters/?page-size=100&page=1';
				if (options.filterLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.filterLegacyId);
				}
				if (options.filterName) {
					endpoint += '&name=' + Data.encodeData(options.filterName);
				}
			} else if (options.data === 'pages' && options.pageId) {
				endpoint += '/catalog/' + options.catalogId + '/page/' + options.pageId + '/';
			} else if (options.data === 'pages') {
				endpoint += '/catalog/' + options.catalogId + '/pages/?page-size=100&page=1';
				if (options.pageLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.pageLegacyId);
				}
				if (options.pageName) {
					endpoint += '&name=' + Data.encodeData(options.pageName);
				}
			} else if (options.data === 'degree_planner' && options.programId) {
				endpoint += '/catalog/' + options.catalogId + '/program/' + options.programId + '/';
			} else if (options.data === 'degree_planner') {
				endpoint += '/catalog/' + options.catalogId + '/programs/?page-size=100&page=1';
				if (options.programLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.programLegacyId);
				}
				if (options.programType) {
					endpoint += '&type=' + Data.encodeData(options.programType);
				}
				if (options.programDegreeType) {
					endpoint += '&degree-type=' + Data.encodeData(options.programDegreeType);
				}
				if (options.programCode) {
					endpoint += '&code=' + Data.encodeData(options.programCode);
				}
				if (options.programName) {
					endpoint += '&name=' + Data.encodeData(options.programName);
				}
			} else if (options.data === 'location' || options.data === 'locations') {
				if (options.locationId){
					endpoint += '/catalog/' + options.catalogId + '/location/' + options.locationId;
				} else {
					endpoint += '/catalog/' + options.catalogId + '/locations/?page-size=100&page=1';
					if (options.locationLegacyId) {
						endpoint += '&legacy-id=' + Data.encodeData(options.locationLegacyId);
					}
				}
			}
			return endpoint;
		}
		/**
		 * Description.
		 *
		 * @param {Object} $element Description.
		 * @param {Object} options Description.
		 * @return {string} widgetType Description.
		 */
		function getWidgetType($element, options) {
			var widgetType = null;
			if ($element.is('a')) {
				if (options.data === 'catalogs') {
					widgetType = 'catalog-link';
				} else if (options.data === 'courses') {
					widgetType = 'course-link';
				} else if (options.data === 'programs') {
					widgetType = 'program-link';
				} else if (options.data === 'entities') {
					widgetType = 'entity-link';
				} else if (options.data === 'filters') {
					widgetType = 'filter-link';
				} else if (options.data === 'pages') {
					widgetType = 'page-link';
				} else if (options.data === 'degree_planner') {
					widgetType = 'degree-planner-link';
				} else {
					widgetType = 'unknown-link';
				}
			} else if ($element.is('ul')) {
				if (options.data === 'catalogs') {
					widgetType = 'catalog-list';
				} else if (options.data === 'courses') {
					widgetType = 'course-list';
				} else if (options.data === 'programs') {
					widgetType = 'program-list';
				} else if (options.data === 'entities') {
					widgetType = 'entity-list';
				} else if (options.data === 'filters') {
					widgetType = 'filter-list';
				} else if (options.data === 'pages') {
					widgetType = 'page-list';
				} else if (options.data === 'degree_planner') {
					widgetType = 'degree-planner-list';
				} else if (options.data === 'location'  || options.data === 'locations') {
					widgetType = 'location-list';
				} else {
					widgetType = 'unknown-list';
				}
			} else {
				if (options.data === 'catalogs') {
					widgetType = 'catalog-content';
				} else if (options.data === 'courses') {
					widgetType = 'course-content';
				} else if (options.data === 'programs') {
					widgetType = 'program-content';
				} else if (options.data === 'entities') {
					widgetType = 'entity-content';
				} else if (options.data === 'filters') {
					widgetType = 'filter-content';
				} else if (options.data === 'pages') {
					widgetType = 'page-content';
				} else if (options.data === 'degree_planner') {
					widgetType = 'degree-planner-content';
				} else if (options.data === 'location'  || options.data === 'locations') {
					widgetType = 'location-content';
				} else {
					widgetType = 'unknown-content';
				}
			}
			return widgetType;
		}
		return {
			getEndpoint: getEndpoint,
			getWidgetType: getWidgetType
		};
	})();
	/**
	 * Description.
	 *
	 * @class AcalogWidgetAPI
	 * @constructor
	 */
	var AcalogWidgetAPI = function AcalogWidgetAPI(elements, _options, _classCallback) {
		var acalog = this;
		/**
		 * Description.
		 *
		 * @type {Object}
		 */
		_options = typeof _options !== 'undefined' ? _options : {};
		_options.api = typeof _options.api !== 'undefined' ? _options.api : null;
		_options.gateway = typeof _options.gateway !== 'undefined' ? _options.gateway : null;
		_options.api = _options.api !== null ? _options.api : _options.gateway;
		/**
		 * Description.
		 *
		 * @type {Array}
		 */
		var _catalogs = [];
		/**
		 * Description.
		 *
		 * @type {Object}
		 */
		var _widgets = {
			'catalog-content': Widgets.CatalogContentWidget,
			'catalog-list': Widgets.CatalogListWidget,
			'catalog-link': Widgets.CatalogLinkWidget,
			'course-content': Widgets.CourseContentWidget,
			'course-list': Widgets.CourseListWidget,
			'course-link': Widgets.CourseLinkWidget,
			'program-content': Widgets.ProgramContentWidget,
			'program-list': Widgets.ProgramListWidget,
			'program-link': Widgets.ProgramLinkWidget,
			'entity-content': Widgets.EntityContentWidget,
			'entity-list': Widgets.EntityListWidget,
			'entity-link': Widgets.EntityLinkWidget,
			'filter-content': Widgets.FilterContentWidget,
			'filter-list': Widgets.FilterListWidget,
			'filter-link': Widgets.FilterLinkWidget,
			'page-content': Widgets.PageContentWidget,
			'page-list': Widgets.PageListWidget,
			'page-link': Widgets.PageLinkWidget,
			'degree-planner-content': Widgets.DegreePlannerContentWidget,
			'degree-planner-list': Widgets.DegreePlannerListWidget,
			'degree-planner-link': Widgets.DegreePlannerLinkWidget,
			'location-content': Widgets.LocationContentWidget,
			'location-list': Widgets.LocationListWidget,
			'unknown-content': Widgets.UnknownContentWidget,
			'unknown-list': Widgets.UnknownListWidget,
			'unknown-link': Widgets.UnknownLinkWidget
		};
		/**
		 * Description.
		 *
		 * @return {Object} globalOptions Description.
		 */
		function getGlobalOptions() {
			var globalOptions = {};
			if (_options.api) {
				globalOptions.api = _options.api;
			}
			if (_options.gateway) {
				globalOptions.gateway = _options.gateway;
			}
			if (_options.data) {
				globalOptions.data = _options.data;
			}
			if (_options.catalogId) {
				globalOptions.catalogId = _options.catalogId;
			}
			if (_options.gatewayCatalogId) {
				globalOptions.catalogLegacyId = _options.gatewayCatalogId;
			}
			if (_options.catalogType) {
				globalOptions.catalogType = _options.catalogType;
			}
			if (_options.catalogName) {
				globalOptions.catalogName = _options.catalogName;
			}
			if (_options.courseId) {
				globalOptions.courseId = _options.courseId;
			}
			if (_options.courseLegacyId) {
				globalOptions.courseLegacyId = _options.courseLegacyId;
			}
			if (_options.courseType) {
				globalOptions.courseType = _options.courseType;
			}
			if (_options.coursePrefix) {
				globalOptions.coursePrefix = _options.coursePrefix;
			}
			if (_options.courseCode) {
				globalOptions.courseCode = _options.courseCode;
			}
			if (_options.courseName) {
				globalOptions.courseName = _options.courseName;
			}
			if (_options.programId) {
				globalOptions.programId = _options.programId;
			}
			if (_options.programLegacyId) {
				globalOptions.programLegacyId = _options.programLegacyId;
			}
			if (_options.programType) {
				globalOptions.programType = _options.programType;
			}
			if (_options.programDegreeType) {
				globalOptions.programDegreeType = _options.programDegreeType;
			}
			if (_options.programCode) {
				globalOptions.programCode = _options.programCode;
			}
			if (_options.programName) {
				globalOptions.programName = _options.programName;
			}
			if (_options.entityId) {
				globalOptions.entityId = _options.entityId;
			}
			if (_options.entityLegacyId) {
				globalOptions.entityLegacyId = _options.entityLegacyId;
			}
			if (_options.entityType) {
				globalOptions.entityType = _options.entityType;
			}
			if (_options.entityName) {
				globalOptions.entityName = _options.entityName;
			}
			if (_options.filterId) {
				globalOptions.filterId = _options.filterId;
			}
			if (_options.filterLegacyId) {
				globalOptions.filterLegacyId = _options.filterLegacyId;
			}
			if (_options.filterName) {
				globalOptions.filterName = _options.filterName;
			}
			if (_options.pageId) {
				globalOptions.pageId = _options.pageId;
			}
			if (_options.pageLegacyId) {
				globalOptions.pageLegacyId = _options.pageLegacyId;
			}
			if (_options.pageName) {
				globalOptions.pageName = _options.pageName;
			}
			if (_options.display) {
				globalOptions.display = _options.display;
			}
			if (_options.linkText) {
				globalOptions.linkText = _options.linkText;
			}
			return globalOptions;
		}
		/**
		 * Description.
		 *
		 * @param {Object} $element Description.
		 * @return {Object} elementOptions Description.
		 */
		function getElementOptions($element) {
			var elementOptions = {};
			var dataAttributes = $element.data();
			if (dataAttributes.acalogData) {
				elementOptions.data = dataAttributes.acalogData;
			}
			if (dataAttributes.acalogCatalogId) {
				elementOptions.catalogId = dataAttributes.acalogCatalogId;
			}
			if (dataAttributes.acalogCatalogLegacyId) {
				elementOptions.catalogLegacyId = dataAttributes.acalogCatalogLegacyId;
			}
			if (dataAttributes.acalogCatalogType) {
				elementOptions.catalogType = dataAttributes.acalogCatalogType;
			}
			if (dataAttributes.acalogCatalogName) {
				elementOptions.catalogName = dataAttributes.acalogCatalogName;
			}
			if (dataAttributes.acalogCourseId) {
				elementOptions.courseId = dataAttributes.acalogCourseId;
			}
			if (dataAttributes.acalogCourseLegacyId) {
				elementOptions.courseLegacyId = dataAttributes.acalogCourseLegacyId;
			}
			if (dataAttributes.acalogCourseType) {
				elementOptions.courseType = dataAttributes.acalogCourseType;
			}
			if (dataAttributes.acalogCoursePrefix) {
				elementOptions.coursePrefix = dataAttributes.acalogCoursePrefix;
			}
			if (dataAttributes.acalogCourseCode) {
				elementOptions.courseCode = dataAttributes.acalogCourseCode;
			}
			if (dataAttributes.acalogCourseName) {
				elementOptions.courseName = dataAttributes.acalogCourseName;
			}
			if (dataAttributes.acalogProgramId) {
				elementOptions.programId = dataAttributes.acalogProgramId;
			}
			if (dataAttributes.acalogProgramLegacyId) {
				elementOptions.programLegacyId = dataAttributes.acalogProgramLegacyId;
			}
			if (dataAttributes.acalogProgramType) {
				elementOptions.programType = dataAttributes.acalogProgramType;
			}
			if (dataAttributes.acalogProgramDegreeType) {
				elementOptions.programDegreeType = dataAttributes.acalogProgramDegreeType;
			}
			if (dataAttributes.acalogProgramCode) {
				elementOptions.programCode = dataAttributes.acalogProgramCode;
			}
			if (dataAttributes.acalogProgramName) {
				elementOptions.programName = dataAttributes.acalogProgramName;
			}
			if (dataAttributes.acalogEntityId) {
				elementOptions.entityId = dataAttributes.acalogEntityId;
			}
			if (dataAttributes.acalogEntityLegacyId) {
				elementOptions.entityLegacyId = dataAttributes.acalogEntityLegacyId;
			}
			if (dataAttributes.acalogEntityType) {
				elementOptions.entityType = dataAttributes.acalogEntityType;
			}
			if (dataAttributes.acalogEntityName) {
				elementOptions.entityName = dataAttributes.acalogEntityName;
			}
			if (dataAttributes.acalogFilterId) {
				elementOptions.filterId = dataAttributes.acalogFilterId;
			}
			if (dataAttributes.acalogFilterLegacyId) {
				elementOptions.filterLegacyId = dataAttributes.acalogFilterLegacyId;
			}
			if (dataAttributes.acalogFilterName) {
				elementOptions.filterName = dataAttributes.acalogFilterName;
			}
			if (dataAttributes.acalogPageId) {
				elementOptions.pageId = dataAttributes.acalogPageId;
			}
			if (dataAttributes.acalogPageLegacyId) {
				elementOptions.pageLegacyId = dataAttributes.acalogPageLegacyId;
			}
			if (dataAttributes.acalogPageName) {
				elementOptions.pageName = dataAttributes.acalogPageName;
			}
			if (dataAttributes.acalogLocationId) {
				elementOptions.locationId = dataAttributes.acalogLocationId;
			}
			if (dataAttributes.acalogLocationLegacyId) {
				elementOptions.locationLegacyId = dataAttributes.acalogLocationLegacyId;
			}
			if (dataAttributes.acalogLocationName) {
				elementOptions.locationName = dataAttributes.acalogLocationName;
			}
			if (dataAttributes.acalogDisplay) {
				elementOptions.display = dataAttributes.acalogDisplay;
			}
			if ($element.is('ul')) {
				elementOptions.placeholder = $element.children('li').html();
			} else {
				elementOptions.placeholder = $element.html();
			}
			if (dataAttributes.acalogLinkText) {
				elementOptions.linkText = dataAttributes.acalogLinkText;
			}
			return elementOptions;
		}
		/**
		 * Description.
		 *
		 * @param {Array} catalogs Description.
		 * @param {number} catalogLegacyId Description.
		 * @return {Array} catalogs Description.
		 */
		function getCatalogIdByCatalogLegacyId(catalogs, catalogLegacyId) {
			var catalogId = null;
			for (var i = 0; i < catalogs.length; i++) {
				var catalog = catalogs[i];
				if (catalog['legacy-id'] === catalogLegacyId) {
					catalogId = catalog.id;
				}
			}
			return catalogId;
		}
		/**
		 * Description.
		 *
		 * @param {Array} catalogs Description.
		 * @param {string} type Description.
		 * @return {number} catalogId Description.
		 */
		function getCatalogIdByType(catalogs, type) {
			var catalogId = null;
			for (var i = 0; i < catalogs.length; i++) {
				var catalog = catalogs[i];
				if (catalog.archived === false && catalog['catalog-type'].name === type) {
					catalogId = catalog.id;
				}
			}
			return catalogId;
		}
		/**
		 * Description.
		 *
		 * @param {Array} catalogs Description.
		 * @param {string} name Description.
		 * @return {number} catalogId Description.
		 */
		function getCatalogIdByName(catalogs, name) {
			var catalogId = null;
			for (var i = 0; i < catalogs.length; i++) {
				var catalog = catalogs[i];
				if (catalog.name === name) {
					catalogId = catalog.id;
				}
			}
			return catalogId;
		}
		/**
		 * Description.
		 *
		 * @param {Array} catalogs Description.
		 * @param {number} catalogId Description.
		 * @return {Array} catalogs Description.
		 */
		function getGatewayCatalogId(catalogs, catalogId) {
			var gatewayCatalogId = null;
			for (var i = 0; i < catalogs.length; i++) {
				var catalog = catalogs[i];
				if (catalog.id === catalogId) {
					gatewayCatalogId = catalog['legacy-id'];
				}
			}
			return gatewayCatalogId;
		}
		/**
		 * Description.
		 *
		 * @param {Object} globalOptions Description.
		 * @param {Object} elementOptions Description.
		 * @return {Object} options Description.
		 */
		function mergeOptions(globalOptions, elementOptions) {
			var options = $.extend({}, globalOptions, elementOptions);
			if (options.catalogLegacyId && options.data !== 'catalogs') {
				options.catalogId = getCatalogIdByCatalogLegacyId(_catalogs, options.catalogLegacyId);
				delete options.catalogLegacyId;
			}
			if (options.catalogType && options.data !== 'catalogs') {
				options.catalogId = getCatalogIdByType(_catalogs, options.catalogType);
				delete options.catalogType;
			}
			if (options.catalogName && options.data !== 'catalogs') {
				options.catalogId = getCatalogIdByName(_catalogs, options.catalogName);
				delete options.catalogName;
			}
			if (typeof options.catalogId === 'undefined') {
				options.catalogId = null;
			}
			options.gatewayCatalogId = getGatewayCatalogId(_catalogs, options.catalogId);
			return options;
		}
		/**
		 * Description.
		 *
		 * @param {Object} $element Description.
		 * @return {void}
		 */
		this.widgetize = function widgetize($element) {
			var widget;
			var globalOptions = getGlobalOptions();
			var elementOptions = getElementOptions($element);
			var options = mergeOptions(globalOptions, elementOptions);
			var endpoint = Utilities.getEndpoint(options);
			var widgetType = Utilities.getWidgetType($element, options);
			Data.get(endpoint, [], widgetType, options, function (data, widgetType) {
				data = Data.fauxFilterData(data, options);
				widget = new _widgets[widgetType]();
				widget.widgetize($element, data, options);
			});
		};
		if (elements.length > 0) {
			Data.get(_options.api + '/widget-api/catalogs/', [], 'list', _options, function (catalogs, widgetType) {
				_catalogs = catalogs !== null ? catalogs: [];
				_classCallback(acalog);
			});
		}
	};
	return AcalogWidgetAPI;
}(jQuery));
},{"@fragaria/address-formatter":1}]},{},[2])
shared/htdocs_gateway/widget-api/shared/htdocs_gateway/widget-api/widget-api.js
/* global jQuery:false */
const addressFormatter = require('@fragaria/address-formatter');
//import addressFormatter from @fragaria/address-formatter;
jQuery.fn.acalogWidgetize = function (options) {
	var $elements = this;
	new AcalogWidgetAPI($elements, options, function (acalogWidgetAPI) {
		$elements.each(function () {
			acalogWidgetAPI.widgetize(jQuery(this));
		});
	});
	return this;
};
var AcalogWidgetAPI = (function ($) {
	'use strict';
	var Widgets = (function Widgets() {
		/**
		 * Converts the filter display options for the filter into a format the Widget API can use.
		 *
		 * @param {string} filterOptions JSON format of the filter display options.
		 * @return {Object} filterOptions JS object of the filter display options.
		 */
		function convertFilterOptions(filterOptions) {
			try {
				filterOptions = JSON.parse(filterOptions);
				filterOptions.program_display = Boolean(filterOptions.program_display);
				filterOptions.course_display = Boolean(filterOptions.course_display);
				filterOptions.program_show_only_active_visible = Boolean(filterOptions.program_show_only_active);
				filterOptions.searchable = Boolean(filterOptions.searchable);
				filterOptions.program_grouping = filterOptions.program_grouping === 2 ? 'degree-type' : filterOptions.program_grouping === 1 ? 'type' : 'none';
				filterOptions.course_grouping = filterOptions.course_grouping === 1 ? 'type' : 'none';
			} catch (e) {
				filterOptions = {};
				filterOptions.program_display = false;
				filterOptions.course_display = false;
				filterOptions.program_show_only_active_visible = true;
				filterOptions.searchable = false;
				filterOptions.program_grouping = 'none';
				filterOptions.course_grouping = 'none';
			}
			return filterOptions;
		}
		/**
		 * Gets the adhocs for the course and puts them into arrays based upon their position.
		 *
		 * @param {number} courseId The course id to get the adhocs for.
		 * @param {Array} adhocs The array of adhocs from the JSON API call.
		 * @return {Object} adhocs The array of adhocs split into positions.
		 */
		function getAdhocs(courseId, _adhocs) {
			var adhocs = {left: [], right: [], before: [], after: []};
			if (_adhocs.length) {
				for (var i = 0; i < _adhocs.length; i++) {
					var adhoc = _adhocs[i];
					if (courseId === adhoc['course-id']) {
						if (adhoc.placement === 'left') {
							adhocs.left.push(adhoc);
						} else if (adhoc.placement === 'right') {
							adhocs.right.push(adhoc);
						} else if (adhoc.placement === 'before') {
							adhocs.before.push(adhoc);
						} else if (adhoc.placement === 'after') {
							adhocs.after.push(adhoc);
						}
					}
				}
			}
			return adhocs;
		}
		/**
		 * Sorts the courses into groups based upon the course type.
		 * This function also filters out inactive courses.
		 *
		 * @param {Array} courses An array of the courses.
		 * @return {Array} groupedCourses An array of the courses grouped by the course type.
		 */
		function getCourseTypeGroupedCourses(courses) {
			var groupedCourses = [];
			var courseTypes = {};
			var courseType = '';
			for (var i = 0; i < courses.length; i++) {
				var course = courses[i];
				if (course.status.active === false) {
					continue;
				}
				if (course.course_types.length) {
					for (var j = 0; j < course.course_types.length; j++) {
						courseType = course.course_types[j].name;
						if (courseType in courseTypes) {
							courseTypes[courseType].push(course);
						} else {
							courseTypes[courseType] = [course];
						}
					}
				} else {
					courseType = 'Other Courses';
					if (courseType in courseTypes) {
						courseTypes[courseType].push(course);
					} else {
						courseTypes[courseType] = [course];
					}
				}
			}
			// todo
			var sortedCourseTypes = Object.keys(courseTypes).sort();
			if (sortedCourseTypes.indexOf('Other Courses') > -1) {
				sortedCourseTypes.splice(sortedCourseTypes.length, 0, sortedCourseTypes.splice(sortedCourseTypes.indexOf('Other Courses'), 1)[0]);
			}
			for (var k = 0; k < sortedCourseTypes.length; k++) {
				groupedCourses.push({
					'type': sortedCourseTypes[k],
					'courses': courseTypes[sortedCourseTypes[k]]
				});
			}
			return groupedCourses;
		}
		/**
		 * Gets an array of the courses with the inactive courses filtered out.
		 *
		 * @param {Array} courses An array of courses.
		 * @return {Array} ungroupedCourses An array of only active courses.
		 */
		function getUngroupedCourses(courses) {
			var ungroupedCourses = [];
			for (var i = 0; i < courses.length; i++) {
				var course = courses[i];
				if (course.status.active === false) {
					continue;
				}
				ungroupedCourses.push(course);
			}
			return ungroupedCourses;
		}
		/**
		 * Sorts the programs into groups based upon the program type.
		 * This function also filters out inactive and filters hidden programs if the program_show_only_active_visible
		 * option is passed in as part of the filterOptions argument
		 *
		 * @param {Array} programs An array of the programs.
		 * @param {Object} filterOptions A JS object of the filter display options.
		 * @return {Array} groupedPrograms An array of the programs grouped by the program type.
		 */
		function getProgramTypeGroupedPrograms(programs, filterOptions) {
			var groupedPrograms = [];
			var programTypes = {};
			var programType = '';
			for (var i = 0; i < programs.length; i++) {
				var program = programs[i];
				if ((filterOptions.program_show_only_active_visible && program.status.visible === false) || program.status.active === false) {
					continue;
				}
				if (program.program_types.length) {
					for (var j = 0; j < program.program_types.length; j++) {
						programType = program.program_types[j].name;
						if (programType in programTypes) {
							programTypes[programType].push(program);
						} else {
							programTypes[programType] = [program];
						}
					}
				} else {
					programType = 'Other Programs';
					if (programType in programTypes) {
						programTypes[programType].push(program);
					} else {
						programTypes[programType] = [program];
					}
				}
			}
			// todo
			var sortedProgramTypes = Object.keys(programTypes).sort();
			if (sortedProgramTypes.indexOf('Other Programs') > -1) {
				sortedProgramTypes.splice(sortedProgramTypes.length, 0, sortedProgramTypes.splice(sortedProgramTypes.indexOf('Other Programs'), 1)[0]);
			}
			for (var k = 0; k < sortedProgramTypes.length; k++) {
				groupedPrograms.push({
					'type': sortedProgramTypes[k],
					'programs': programTypes[sortedProgramTypes[k]]
				});
			}
			return groupedPrograms;
		}
		/**
		 * Sorts the programs into groups based upon the degree type.
		 * This function also filters out inactive and filters hidden programs is the program_show_only_active_visible
		 * option is passed in as part of the filterOptions argument
		 *
		 * @param {Array} programs An array of the programs.
		 * @param {Object} filterOptions A JS object of the filter display options.
		 * @return {Array} groupedPrograms An array of the programs groupped by the degree type.
		 */
		function getDegreeTypeGroupedPrograms(programs, filterOptions) {
			var groupedPrograms = [];
			var degreeTypes = {};
			var degreeType = '';
			for (var i = 0; i < programs.length; i++) {
				var program = programs[i];
				if ((filterOptions.program_show_only_active_visible && program.status.visible === false) || program.status.active === false) {
					continue;
				}
				if (program.degree_types.length) {
					for (var j = 0; j < program.degree_types.length; j++) {
						degreeType = program.degree_types[j].name;
						if (degreeType in degreeTypes) {
							degreeTypes[degreeType].push(program);
						} else {
							degreeTypes[degreeType] = [program];
						}
					}
				} else {
					degreeType = 'Other Programs';
					if (degreeType in degreeTypes) {
						degreeTypes[degreeType].push(program);
					} else {
						degreeTypes[degreeType] = [program];
					}
				}
			}
			// todo
			var sortedDegreeTypes = Object.keys(degreeTypes).sort();
			if (sortedDegreeTypes.indexOf('Other Programs') > -1) {
				sortedDegreeTypes.splice(sortedDegreeTypes.length, 0, sortedDegreeTypes.splice(sortedDegreeTypes.indexOf('Other Programs'), 1)[0]);
			}
			for (var k = 0; k < sortedDegreeTypes.length; k++) {
				groupedPrograms.push({
					'type': sortedDegreeTypes[k],
					'programs': degreeTypes[sortedDegreeTypes[k]]
				});
			}
			return groupedPrograms;
		}
		/**
		 * Gets an array of the programs with the inactive courses and hidden courses if the program_show_only_active_visible 
		 * option is passed in as part of the filterOptions argument filtered out.
		 *
		 * @param {Array} programs An array of the programs.
		 * @param {Object} filterOptions A JS object of the filter display options.
		 * @return {Array} ungroupedPrograms An array of only active programs.
		 */
		function getUngroupedPrograms(programs, filterOptions) {
			var ungroupedPrograms = [];
			for (var i = 0; i < programs.length; i++) {
				var program = programs[i];
				if ((filterOptions.program_show_only_active_visible && program.status.visible === false) || program.status.active === false) {
					continue;
				}
				ungroupedPrograms.push(program);
			}
			return ungroupedPrograms;
		}
		/**
		 * Renders a catalog.
		 *
		 * @param {Object} catalog The catalog to render.
		 * @param {Object} options Rendering options.
		 * @return {string} html The generated HTML.
		 */
		function renderCatalog(catalog, options) {
			var html = '';
			html += '<h1 class="acalog-catalog-name">' + catalog.name + '</h1>';
			html += '<div class="acalog-catalog-description">' + catalog.description + '</div>';
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a course
		 *
		 * @param {Object} course The course to render.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the course is loaded
		 * @return {string} html The generated HTML.
		 */
		function renderCourse(course, options) {
			var html = '';
			html += '<h1 class="acalog-course-title">' + course.title + '</h1>';
			if (course.hasOwnProperty('locations')) {
				const locations = course.locations.map(loc => loc.name).join(', ');
				if (locations.length > 0) {
					html += '<h3 class="acalog-course-location"><b>Location(s):</b><span>'+ locations + '</span></h3>';
				}
			}
			if (course.body) {
				html += '<div class="acalog-course-body">' + course.body + '</div>';
			} else {
				course.api = '/' + course.url.split('/').slice(3).join('/');
				html += '<div class="acalog-course-body" data-acalog-ajax="' + course.api + '" data-acalog-ajax-type="course-body">' + options.placeholder + '</div>';
			}
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a program.
		 *
		 * @param {Object} program The program to render.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderProgram(program, options) {
			var html = '';
			html += '<h1 class="acalog-program-name">' + program.name + '</h1>';
			if (program.hasOwnProperty('locations')) {
				const locations = program.locations.map(loc => loc.name).join(', ');
				if (locations.length > 0) {
					html += '<h3 class="acalog-program-location"><b>Location(s):</b><span>'+ locations + '</span></h3>';
				}
			}
			if (program.hasOwnProperty('description')) {
				html += '<div class="acalog-program-description">' + program.description + '</div>';
			} else {
				program.api = '/' + program.url.split('/').slice(3).join('/');
				html += '<div class="acalog-program-description" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="program">' + options.placeholder + '</div>';
			}
			if (program.hasOwnProperty('cores')) {
				html += '<div class="acalog-program-cores">' + renderCores(program.cores, 2, options) + '</div>';
			} else {
				program.api = '/' + program.url.split('/').slice(3).join('/');
				html += '<div class="acalog-program-cores" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="cores">' + options.placeholder + '</div>';
			}
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a list of cores.
		 *
		 * @param {Array} cores The cores to render.
		 * @param {number} index The header tag size for the core name.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderCores(cores, index, options) {
			var html = '';
			var coreHeading = index > 6 ? 6 : index;
			var courseHeading = coreHeading === 6 ? 6 : coreHeading + 1;
			for (var i = 0; i < cores.length; i++) {
				var core = cores[i];
				html += '<div class="acalog-program-core">';
					html += '<h' + coreHeading + ' class="acalog-program-core-name">' + core.name + '</h' + coreHeading + '>';
					if (core.description.length) {
						html += '<div class="acalog-program-core-description">' + core.description + '</div>';
					}
					if (core.courses.length) {
						html += '<ul class="acalog-program-core-courses">';
						for (var j = 0; j < core.courses.length; j++) {
							var course = core.courses[j];
							course.gateway = options.gateway + getGatewayURL('course', options.gatewayCatalogId, course['legacy-id']);
							course.api = '/' + course.url.split('/').slice(3).join('/');
							course.adhocs = getAdhocs(course.id, core.adhocs);
							for (var k = 0; k < course.adhocs.before.length; k++) {
								var adhocBefore = course.adhocs.before[k];
								html += adhocBefore.display;
							}
							html += '<li class="acalog-program-core-course">';
								for (var l = 0; l < course.adhocs.left.length; l++) {
									var adhocLeft = course.adhocs.left[l];
									html += adhocLeft.display + ' ';
								}
								html += '<a class="acalog-program-core-course-link" href="' + course.gateway + '">' + course.title + '</a>';
								for (var m = 0; m < course.adhocs.right.length; m++) {
									var adhocRight = course.adhocs.right[m];
									html += ' ' + adhocRight.display;
								}
								html += '<div class="acalog-program-core-course-container">';
									html += '<h' + courseHeading + ' class="acalog-program-core-course-title">' + course.title + '</h' + courseHeading + '>';
									html += '<div class="acalog-program-core-course-body" data-acalog-ajax="' + course.api + '" data-acalog-ajax-type="course-body">' + options.placeholder + '</div>';
									html += '<a href="#" class="acalog-close">Close</a>';
								html += '</div>';
							html += '</li>';
							for (var n = 0; n < course.adhocs.after.length; n++) {
								var adhocAfter = course.adhocs.after[n];
								html += adhocAfter.display;
							}
						}
						html += '</ul>';
					}
					if (core.children.length) {
						html += '<div class="acalog-program-cores">' + renderCores(core.children, index + 1, options) + '</div>';
					}
				html += '</div>';
			}
			return html;
		}
		/**
		 * Renders of list of programs.
		 *
		 * @param {Object} programs The programs to render.
		 * @param {Object} filterOptions A JS object of the filter display options.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderPrograms(programs, filterOptions, options) {
			var program;
			var html = '';
			if (filterOptions.program_grouping === 'type') {
				var programTypeGroupedPrograms = getProgramTypeGroupedPrograms(programs, filterOptions);
				if (programTypeGroupedPrograms.length) {
					html += '<h2>Programs</h2>';
					for (var i = 0; i < programTypeGroupedPrograms.length; i++) {
						html += '<h3>' + programTypeGroupedPrograms[i].type + '</h3>';
						html += '<ul>';
						for (var j = 0; j < programTypeGroupedPrograms[i].programs.length; j++) {
							program = programTypeGroupedPrograms[i].programs[j];
							program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
							html += '<li class="acalog-program">';
								html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
								program.api = '/' + program.url.split('/').slice(3).join('/');
								html += '<div class="acalog-program-container" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="program">';
									html += options.placeholder;
								html += '</div>';
							html += '</li>';
						}
						html += '</ul>';
					}
				}
			} else if (filterOptions.program_grouping === 'degree-type') {
				var degreeTypeGroupedPrograms = getDegreeTypeGroupedPrograms(programs, filterOptions);
				if (degreeTypeGroupedPrograms.length) {
					html += '<h2>Programs</h2>';
					for (var k = 0; k < degreeTypeGroupedPrograms.length; k++) {
						html += '<h3>' + degreeTypeGroupedPrograms[k].type + '</h3>';
						html += '<ul>';
						for (var l = 0; l < degreeTypeGroupedPrograms[k].programs.length; l++) {
							program = degreeTypeGroupedPrograms[k].programs[l];
							program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
							html += '<li class="acalog-program">';
								html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
								program.api = '/' + program.url.split('/').slice(3).join('/');
								html += '<div class="acalog-program-container" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="program">';
									html += options.placeholder;
								html += '</div>';
							html += '</li>';
						}
						html += '</ul>';
					}
				}
			} else {
				var ungroupedPrograms = getUngroupedPrograms(programs, filterOptions);
				if (ungroupedPrograms.length) {
					html += '<h2>Programs</h2>';
					html += '<ul>';
					for (var m = 0; m < ungroupedPrograms.length; m++) {
						program = ungroupedPrograms[m];
						program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
						html += '<li class="acalog-program">';
							html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
							program.api = '/' + program.url.split('/').slice(3).join('/');
							html += '<div class="acalog-program-container" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="program">';
								html += options.placeholder;
							html += '</div>';
						html += '</li>';
					}
					html += '</ul>';
				}
			}
			return html;
		}
		/**
		 * Renders a list of courses.
		 *
		 * @param {Object} courses The courses to render.
		 * @param {Object} filterOptions A JS option of the filter display options.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderCourses(courses, filterOptions, options) {
			var course;
			var html = '';
			if (courses.length) {
				if (filterOptions.course_grouping === 'type') {
					var courseTypeGroupedCourses = getCourseTypeGroupedCourses(courses);
					if (courseTypeGroupedCourses.length) {
						html += '<h2>Courses</h2>';
						for (var i = 0; i < courseTypeGroupedCourses.length; i++) {
							html += '<h3>' + courseTypeGroupedCourses[i].type + '</h3>';
							html += '<ul>';
							for (var j = 0; j < courseTypeGroupedCourses[i].courses.length; j++) {
								course = courseTypeGroupedCourses[i].courses[j];
								course.gateway = options.gateway + getGatewayURL('course', options.gatewayCatalogId, course['legacy-id']);
								html += '<li class="acalog-course">';
									html += '<a class="acalog-course-link" href="' + course.gateway + '">' + course.title + '</a>';
									html += '<div class="acalog-course-container">';
										html += renderCourse(course, options);
									html += '</div>';
								html += '</li>';
							}
							html += '</ul>';
						}
					}
				} else {
					var ungroupedCourses = getUngroupedCourses(courses);
					if (ungroupedCourses.length) {
						html += '<h2>Courses</h2>';
						html += '<ul>';
						for (var k = 0; k < ungroupedCourses.length; k++) {
							course = ungroupedCourses[k];
							course.gateway = options.gateway + getGatewayURL('course', options.gatewayCatalogId, course['legacy-id']);
							html += '<li class="acalog-course">';
								html += '<a class="acalog-course-link" href="' + course.gateway + '">' + course.title + '</a>';
								html += '<div class="acalog-course-container">';
									html += renderCourse(course, options);
								html += '</div>';
							html += '</li>';
						}
						html += '</ul>';
					}
				}
			}
			return html;
		}
		/**
		 * Renders an entity.
		 *
		 * @param {Object} entity The entity to render.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * 		program_display: Boolean to display programs or not
		 * 		course_display: Boolean to display courses or not
		 * @return {string} html The generated HTML.
		 */
		function renderEntity(entity, options) {
			// todo
			entity.options = convertFilterOptions(entity.options);
			var html = '';
			html += '<h1 class="acalog-entity-name">' + entity.name + '</h1>';
			html += '<div class="acalog-entity-description">' + entity.description + '</div>';
			if (entity.hasOwnProperty('programs') && entity.hasOwnProperty('options') && entity.options.program_display) {
				html += '<div class="acalog-entity-programs">' + renderPrograms(entity.programs, entity.options, options) + '</div>';
			} else if (entity.hasOwnProperty('options') && entity.options.program_display) {
				entity.api = '/' + entity.url.split('/').slice(3).join('/');
				html += '<div class="acalog-entity-programs" data-acalog-ajax="' + entity.api + '" data-acalog-ajax-type="programs">' + options.placeholder + '</div>';
			}
			if (entity.hasOwnProperty('courses') && entity.hasOwnProperty('options') && entity.options.course_display) {
				html += '<div class="acalog-entity-courses">' + renderCourses(entity.courses, entity.options, options) + '</div>';
			} else if (entity.hasOwnProperty('options') && entity.options.course_display) {
				entity.api = '/' + entity.url.split('/').slice(3).join('/');
				html += '<div class="acalog-entity-courses" data-acalog-ajax="' + entity.api + '" data-acalog-ajax-type="courses">' + options.placeholder + '</div>';
			}
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a filter.
		 *
		 * @param {Object} filter The filter to render.
		 * @param {Object} options Rendering options.
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderFilter(filter, options) {
			var temp = '<p>Full filter support coming soon. <a href="' + options.gateway + getGatewayURL('filter', options.gatewayCatalogId, filter['legacy-id']) + '">Click here</a> to view the filter.</p>';
			var html = '';
			html += '<h1 class="acalog-filter-name">' + filter.name + '</h1>';
			html += '<div class="acalog-filter-description">' + filter.content + '</div>';
			html += '<div class="acalog-filter-content">' + temp + '</div>';
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a custom page.
		 *
		 * @param {Object} page The custom page to render.
		 * @param {Object} options Rendering options.
		 * @return {string} html The generated HTML.
		 */
		function renderPage(page, options) {
			var html = '';
			html += '<h1 class="acalog-page-name">' + page.name + '</h1>';
			html += '<div class="acalog-page-description">' + page.content + '</div>';
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a degree planner.
		 * TODO: Update to render the degree planner, currently renders the program
		 *
		 * @param {Object} program The program to render the degree planner for.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderDegreePlanner(program, options) {
			var html = '';
			html += '<h1 class="acalog-program-name">' + program.name + '</h1>';
			html += '<div class="acalog-program-description">' + program.description + '</div>';
			if (program.hasOwnProperty('cores')) {
				html += '<div class="acalog-program-cores">' + renderCores(program.cores, 2, options) + '</div>';
			} else {
				program.api = '/' + program.url.split('/').slice(3).join('/');
				html += '<div class="acalog-program-cores" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="cores">' + options.placeholder + '</div>';
			}
			html += '<a href="#" class="acalog-close">Close</a>';
			return html;
		}
		/**
		 * Renders a list of degree planners.
		 * TODO: Update to render the degree planners, currently renders the list of programs
		 *
		 * @param {Object} programs The programs to render the degree planners for.
		 * @param {Object} filterOptions A JS object of the filter display options.
		 * @param {Object} options Rendering options.
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * @return {string} html The generated HTML.
		 */
		function renderDegreePlanners(programs, filterOptions, options) {
			var program;
			var html = '';
			if (filterOptions.program_grouping === 'type') {
				var programTypeGroupedPrograms = getProgramTypeGroupedPrograms(programs, filterOptions);
				if (programTypeGroupedPrograms.length) {
					html += '<h2>Programs</h2>';
					for (var i = 0; i < programTypeGroupedPrograms.length; i++) {
						html += '<h3>' + programTypeGroupedPrograms[i].type + '</h3>';
						html += '<ul>';
						for (var j = 0; j < programTypeGroupedPrograms[i].programs.length; j++) {
							program = programTypeGroupedPrograms[i].programs[j];
							program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
							html += '<li class="acalog-program">';
								html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
								html += '<div class="acalog-program-container">';
									html += renderDegreePlanner(program, options);
								html += '</div>';
							html += '</li>';
						}
						html += '</ul>';
					}
				}
			} else if (filterOptions.program_grouping === 'degree-type') {
				var degreeTypeGroupedPrograms = getDegreeTypeGroupedPrograms(programs, filterOptions);
				if (degreeTypeGroupedPrograms.length) {
					html += '<h2>Programs</h2>';
					for (var k = 0; k < degreeTypeGroupedPrograms.length; k++) {
						html += '<h3>' + degreeTypeGroupedPrograms[k].type + '</h3>';
						html += '<ul>';
						for (var l = 0; l < degreeTypeGroupedPrograms[k].programs.length; l++) {
							program = degreeTypeGroupedPrograms[k].programs[l];
							program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
							html += '<li class="acalog-program">';
								html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
								html += '<div class="acalog-program-container">';
									html += renderDegreePlanner(program, options);
								html += '</div>';
							html += '</li>';
						}
						html += '</ul>';
					}
				}
			} else {
				var ungroupedPrograms = getUngroupedPrograms(programs, filterOptions);
				if (ungroupedPrograms.length) {
					html += '<h2>Programs</h2>';
					html += '<ul>';
					for (var m = 0; m < ungroupedPrograms.length; m++) {
						program = ungroupedPrograms[m];
						program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
						html += '<li class="acalog-program">';
							html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
							html += '<div class="acalog-program-container">';
								html += renderDegreePlanner(program, options);
							html += '</div>';
						html += '</li>';
					}
					html += '</ul>';
				}
			}
			return html;
		}
		function renderLocation(location, options) {
			let html = '';
			html += '<span class="acalog-location-container"><h1 class="acalog-location-name">' + location.name + '</h1>';
			let address = location.address;
			let formattedAddress = addressFormatter.format({
				city: address.city,
				state: address.state,
				countryCode: address.country,
				postcode: address.postal_code,
				road: address.street,
				county: address.county,
				house: address.building_number,
				suite: address.suite,
			}, {
				output: 'array'
			});
			html += '<address class="acalog-location-address">' + formattedAddress.join('<br/>') + '</address>';
			html += '</span>';
			return html;
		}
		/**
		 * Gets the gateway URL for the types of widgets.
		 *
		 * @param {string} type Widget type to get the URL for.
		 * @param {number} catalogId The legacy ID of the catalog.
		 * @param {number} itemId The legacy ID of the item.
		 * @return {string} gatewayURL The gateway URL for the widget.
		 */
		function getGatewayURL(type, catalogId, itemId) {
			var gatewayURL = '';
			if (type === 'index') {
				gatewayURL += '/index.php?catoid=' + catalogId;
			} else if (type === 'course') {
				gatewayURL += '/preview_course_nopop.php?catoid=' + catalogId + '&coid=' + itemId;
			} else if (type === 'program') {
				gatewayURL += '/preview_program.php?catoid=' + catalogId + '&poid=' + itemId;
			} else if (type === 'entity') {
				gatewayURL += '/preview_entity.php?catoid=' + catalogId + '&ent_oid=' + itemId;
			} else if (type === 'filter') {
				gatewayURL += '/content.php?catoid=' + catalogId + '&navoid=' + itemId;
			} else if (type === 'page') {
				gatewayURL += '/content.php?catoid=' + catalogId + '&navoid=' + itemId;
			} else if (type === 'media') {
				gatewayURL += '/mime/media/view/' + catalogId + '/' + itemId + '/';
			} else if (type === 'degree_planner') {
				gatewayURL += '/preview_degree_planner.php?catoid=' + catalogId + '&poid=' + itemId + '&print'
			}
			return gatewayURL;
		}
		/**
		 * Calls the appropriate render functions and updates the element with the generated HTML.
		 *
		 * @param {Object} $element The element to update.
		 * @param {Object} options Rendering options.
		 * 		api: The URL for the Widget API
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * 		program_display: Boolean to display programs or not
		 * 		course_display: Boolean to display courses or not
		 * @return {void}
		 */
		function updateData($element, options, callback) {
			var endpoint = options.api + '/widget-api' + $element.data('acalog-ajax');
			var type = $element.data('acalog-ajax-type');
			$element.removeData('acalog-ajax');
			$element.removeAttr('data-acalog-ajax');
			$element.removeData('acalog-ajax-type');
			$element.removeAttr('data-acalog-ajax-type');
			var widgetType = Utilities.getWidgetType($element, options);
			Data.get(endpoint, [], widgetType, options, function (data, widgetType) {
				if (data.length) {
					data = data[0];
					if (type === 'course-body' && data.hasOwnProperty('body')) {
						$element.html(data.body);
					} else if (type === 'cores' && data.hasOwnProperty('cores')) {
						var cores = renderCores(data.cores, 2, options);
						$element.html(cores);
					} else if (type === 'programs' && data.hasOwnProperty('programs') && data.hasOwnProperty('options')) {
						// todo
						data.options = convertFilterOptions(data.options);
						var programs = renderPrograms(data.programs, data.options, options);
						$element.html(programs);
					} else if (type === 'courses' && data.hasOwnProperty('courses') && data.hasOwnProperty('options')) {
						// todo
						data.options = convertFilterOptions(data.options);
						var courses = renderCourses(data.courses, data.options, options);
						$element.html(courses);
					} else if (type === 'course') {
						var course = renderCourse(data, options);
						$element.html(course);
					} else if (type === 'program') {
						var program = renderProgram(data, options);
						$element.html(program);
					} else if (type === 'entity') {
						var entity = renderEntity(data, options);
						$element.html(entity);
					} else if (type === 'filter') {
						var filter = renderFilter(data, options);
						$element.html(filter);
					} else if (type === 'page') {
						var page = renderPage(data, options);
						$element.html(page);
					} else if (type === 'media') {
						$element.html('');
					} else if (type === 'degree_planner' && data.hasOwnProperty('programs') && data.hasOwnProperty('options')) {
						data.options = convertFilterOptions(data.options);
						var degree_planners = renderDegreePlanners(data.programs, data.options, options);
						$element.html(degree_planners);
					} else if (type === 'degree_planner') {
						var degree_planner = renderDegreePlanner(data, options);
						$element.html(degree_planner);
					} else if (type === 'location' || type === 'locations'){
						var location = renderLocation(data, options);
						$element.html(location);
					} else {
						$element.html('<span class="acalog-error">Error</span>');
					}
				} else {
					$element.html('<span class="acalog-error">Error</span>');
				}
				callback() ;
			});
		}
		/**
		 * Convert the permalink links from the JSON API into the correct format based upon the type.
		 *
		 * @param {Object} $element The element containing the permalinks.
		 * @param {Object} options Rendering options.
		 * 		api: The URL for the Widget API
		 * 		placeholder: The text to display until the program is loaded
		 * 		gateway: The gateway URL
		 * 		gatewatCatalogId: The legacy ID for the catalog
		 * 		program_display: Boolean to display programs or not
		 * 		course_display: Boolean to display courses or not
		 * @param {Boolean} nested Boolean if the permalink is nested inside of another permalink, used for inline permalinks.
		 * @return {void}
		 */
		function updatePermalinks($element, options, nested) {
			$element.find('.permalink').each(function () {
				var html = '';
				var permalink = $(this).data();
				permalink.display = $(this).text();
				if (permalink.to_type === 'hierarchy') {
					permalink.to_type = 'entity';
				} else if (permalink.to_type === 'content' && permalink.to_url.indexOf('page') !== -1) {
					permalink.to_type = 'page';
				} else if (permalink.to_type === 'content' && permalink.to_url.indexOf('media') !== -1) {
					permalink.to_type = 'media';
				} else if (permalink.to_type === 'content' && permalink.to_url.indexOf('filter') !== -1) {
					permalink.to_type = 'filter';
				} else if (permalink.to_type === 'content' && permalink.to_url.indexOf('direct-link') !== -1) {
					permalink.to_type = 'filter';
				}
				if (permalink.hasOwnProperty('to_url')) {
					permalink.api = '/' + permalink.to_url.split('/').slice(3).join('/');
				}
				permalink.gateway = options.gateway + getGatewayURL(permalink.to_type, options.gatewayCatalogId, permalink.to_legacy_id);
				if (permalink.anchor_text.length) {
					permalink.gateway += '#' + permalink.anchor_text;
				}
				if (permalink.inactive === true) {
					html += '<div class="acalog-permalink">';
						html += '<span class="acalog-permalink-inactive">' + permalink.display + '</span>';
					html += '</div>';
				} else if ($(this).is('img')) {
					// Copy the style attribute, if any, to the new element
					var styleAttr = '';
					if ($(this)[0].hasAttribute('style')){
						styleAttr=' style="'+ $(this)[0].style.cssText + '"'
					}
					html += '<img class="acalog-permalink" src="' + permalink.gateway + '"'+ styleAttr +'>';
				} else if (permalink.display_type === 'inline' && nested === true) {
					html += '<div class="acalog-permalink">';
						html += '<a target="_blank" class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
					html += '</div>';
				} else if (permalink.display_type === 'inline') {
					html += '<div class="acalog-permalink acalog-permalink-inline">';
						html += '<a class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
						html += '<div class="acalog-permalink-container' + (permalink.show_title ? '' : ' acalog-permalink-hidetitle') + '" data-acalog-ajax="' + permalink.api + '" data-acalog-ajax-type="' + permalink.to_type + '">' + options.placeholder + '</div>';
					html += '</div>';
				} else if (permalink.display_type === 'tooltip' && permalink.api != undefined) {
					html += '<div class="acalog-permalink acalog-permalink-tooltip">';
						html += '<a class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
						html += '<div class="acalog-permalink-container" data-acalog-ajax="' + permalink.api + '"  data-acalog-ajax-type="' + permalink.to_type + '">' + options.placeholder + '</div>';
					html += '</div>';
				} else if (permalink.display_type === 'dynamic' && permalink.api != undefined) {
					html += '<div class="acalog-permalink acalog-permalink-showhide">';
						html += '<a class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
						html += '<div class="acalog-permalink-container" data-acalog-ajax="' + permalink.api + '" data-acalog-ajax-type="' + permalink.to_type + '">' + options.placeholder + '</div>';
					html += '</div>';
				} else if (permalink.display_type === 'same') {
					html += '<div class="acalog-permalink">';
						html += '<a class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
					html += '</div>';
				} else if (permalink.display_type === 'new') {
					html += '<div class="acalog-permalink">';
						html += '<a target="_blank" class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
					html += '</div>';
				} else if (permalink.display_type === 'popup') {
					html += '<div class="acalog-permalink">';
						html += '<a target="_blank" class="acalog-permalink-link" href="' + permalink.gateway + '" >' + permalink.display + '</a>';
					html += '</div>';
				} else {
					html += '<div class="acalog-permalink">';
						html += '<span class="acalog-permalink-text">' + permalink.display + '</span>';
					html += '</div>';
				}
				$(this).replaceWith(html);
			});
			$element.find('.acalog-permalink-inline').each(function () {
				var $permalink = $(this);
				var $permalinkContainer = $(this).children('.acalog-permalink-container');
				$permalink.addClass('acalog-permalink-open');
				if ($permalinkContainer.attr('data-acalog-ajax')) {
					updateData($permalinkContainer, options, function () {
						updatePermalinks($permalinkContainer, options, true);
					});
				}
			});
			if (options.display === 'dynamic') {
				$element.on('click', '.acalog-permalink-tooltip > .acalog-permalink-link, .acalog-permalink-showhide > .acalog-permalink-link', function (event) {
					event.preventDefault();
					event.stopPropagation();
					var $permalink = $(this).parent();
					var $permalinkContainer = $permalink.children('.acalog-permalink-container');
					$permalink.toggleClass('acalog-permalink-open');
					if ($permalinkContainer.attr('data-acalog-ajax')) {
						updateData($permalinkContainer, options, function () {
							updatePermalinks($permalinkContainer, options, true);
						});
					}
				});
				$element.on('click', '.acalog-permalink .acalog-permalink-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-permalink-open');
				});
				$element.on('click', '.acalog-course > .acalog-course-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-course-open');
				});
				$element.on('click', '.acalog-program > .acalog-program-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-program-open');
				});
				$element.on('click', '.acalog-program-core-course > .acalog-program-core-course-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-program-core-course-open');
				});
				$element.on('click', '.acalog-entity > .acalog-entity-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-entity-open');
				});
				$element.on('click', '.acalog-filter > .acalog-filter-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-filter-open');
				});
				$element.on('click', '.acalog-page > .acalog-page-container > .acalog-close', function (event) {
					event.preventDefault();
					event.stopPropagation();
					$(this).parent().parent().toggleClass('acalog-page-open');
				});
			}
		}
		/**
		 * Widget for the Catalog Content.
		 *
		 * @class CatalogContentWidget
		 * @constructor
		 */
		function CatalogContentWidget() {
			/**
			 * Renders the HTML for the catalog content type widget.
			 *
			 * @param {Array} catalogs The list to render the first catalog of.
			 * @param {Object} options Rendering options.
			 * @return {string} html The generated HTML.
			 */
			function renderHTML(catalogs, options) {
				var html = '';
				if (catalogs.length) {
					var catalog = catalogs[0];
					html += renderCatalog(catalog, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Call the function to render the widget and update the element with the HTML.
			 *
			 * @param {Object} $element The element to update.
			 * @param {Array} data The date for the catalog.
			 * @param {Object} options Rendering options.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'catalog-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
			};
		}
		/**
		 * Description.
		 *
		 * @class CatalogListWidget
		 * @constructor
		 */
		function CatalogListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} catalogs Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(catalogs, options) {
				var html = '';
				if (catalogs.length) {
					for (var i = 0; i < catalogs.length; i++) {
						var catalog = catalogs[i];
						catalog.gateway = options.gateway + getGatewayURL('index', catalog['legacy-id'], catalog['legacy-id']);
						html += '<li class="acalog-catalog">';
							html += '<a class="acalog-catalog-link" href="' + catalog.gateway + '">' + catalog.name + '</a>';
							html += '<div class="acalog-catalog-container">';
								html += renderCatalog(catalog, options);
							html += '</div>';
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-catalog">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'catalog-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
			};
		}
		/**
		 * Description.
		 *
		 * @class CatalogLinkWidget
		 * @constructor
		 */
		function CatalogLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('index', legacyItemId, legacyItemId);
					text = data[0].name;
				} else {
					Data.reportError(options.api, 'catalog-link', $element.prop('outerHTML'));
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class CourseContentWidget
		 * @constructor
		 */
		function CourseContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} course Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(courses, options) {
				var html = '';
				if (courses.length) {
					var course = courses[0];
					html += renderCourse(course, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'course-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
			};
		}
		/**
		 * Description.
		 *
		 * @class CourseListWidget
		 * @constructor
		 */
		function CourseListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} courses Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(courses, options) {
				var html = '';
				if (courses.length) {
					for (var i = 0; i < courses.length; i++) {
						var course = courses[i];
						course.gateway = options.gateway + getGatewayURL('course', options.gatewayCatalogId, course['legacy-id']);
						html += '<li class="acalog-course">';
							html += '<a class="acalog-course-link" href="' + course.gateway + '">' + course.title + '</a>';
							if (course.url) {
								course.api = '/' + course.url.split('/').slice(3).join('/');
								html += '<div class="acalog-course-container" data-acalog-ajax="' + course.api + '" data-acalog-ajax-type="course">';
									html += options.placeholder;
								html += '</div>';
							} else {
								html += '<div class="acalog-course-container">';
									html += renderCourse(course, options);
								html += '</div>';
							}
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-course">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'course-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-course-open');
						var $course_body = $(this).next('div.acalog-course-container');
						if ($course_body.data('acalog-ajax')) {
							updateData($course_body, options, function() {
								updatePermalinks($course_body, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class CourseLinkWidget
		 * @constructor
		 */
		function CourseLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('course', options.gatewayCatalogId, legacyItemId);
					text = data[0].title;
				} else {
					Data.reportError(options.api, 'course-link', $element.prop('outerHTML'));
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class ProgramContentWidget
		 * @constructor
		 */
		function ProgramContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} program Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(programs, options) {
				var html = '';
				if (programs.length) {
					var program = programs[0];
					html += renderProgram(program, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'program-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				var $cores = $element.children('.acalog-program-cores');
				if ($cores.attr('data-acalog-ajax')) {
					updateData($cores, options, function () {
						updatePermalinks($cores, options, false);
					});
				}
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-program-core-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-core-course-open');
						var $courseBody = $(this).siblings('.acalog-program-core-course-container:first').children('.acalog-program-core-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class ProgramListWidget
		 * @constructor
		 */
		function ProgramListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} programs Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(programs, options) {
				var html = '';
				if (programs.length) {
					for (var i = 0; i < programs.length; i++) {
						var program = programs[i];
						program.gateway = options.gateway + getGatewayURL('program', options.gatewayCatalogId, program['legacy-id']);
						html += '<li class="acalog-program">';
							html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
							if (program.url) {
								program.api = '/' + program.url.split('/').slice(3).join('/');
								html += '<div class="acalog-program-container" data-acalog-ajax="' + program.api + '" data-acalog-ajax-type="program">';
									html += options.placeholder;
								html += '</div>';
							} else {
								html += '<div class="acalog-program-container">';
									html += renderProgram(program, options);
								html += '</div>';
							}
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-program">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'program-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-program-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-open');
						var $program_body = $(this).next('div.acalog-program-container');
						if ($program_body.data('acalog-ajax')) {
							updateData($program_body, options, function() {
								updatePermalinks($program_body, options, false);
							});
						}
					});
					$element.on('click', '.acalog-program-core-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-core-course-open');
						var $courseBody = $(this).next('.acalog-program-core-course-container').children('.acalog-program-core-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class ProgramLinkWidget
		 * @constructor
		 */
		function ProgramLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('program', options.gatewayCatalogId, legacyItemId);
					text = data[0].name;
				} else {
					Data.reportError(options.api, 'program-link', $element.prop('outerHTML'));
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class EntityContentWidget
		 * @constructor
		 */
		function EntityContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} entities Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(entities, options) {
				var html = '';
				if (entities.length) {
					var entity = entities[0];
					html += renderEntity(entity, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'entity-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				var $programs = $element.children('.acalog-entity-programs');
				if ($programs.attr('data-acalog-ajax')) {
					updateData($programs, options, function () {
						updatePermalinks($programs, options, false);
					});
				}
				var $courses = $element.children('.acalog-entity-courses');
				if ($courses.attr('data-acalog-ajax')) {
					updateData($courses, options, function () {
						updatePermalinks($courses, options, false);
					});
				}
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-course-open');
						var $courseBody = $(this).next('.acalog-course-container').children('.acalog-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
					$element.on('click', '.acalog-program-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-open');
						var $program = $(this).next('.acalog-program-container');
						if ($program.attr('data-acalog-ajax')) {
							updateData($program, options, function () {
								updatePermalinks($program, options, false);
							});
						}
						var $cores = $(this).next('.acalog-program-container').children('.acalog-program-cores');
						if ($cores.attr('data-acalog-ajax')) {
							updateData($cores, options, function () {
								updatePermalinks($cores, options, false);
							});
						}
					});
					$element.on('click', '.acalog-program-core-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-core-course-open');
						var $courseBody = $(this).next('.acalog-program-core-course-container').children('.acalog-program-core-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class EntityListWidget
		 * @constructor
		 */
		function EntityListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} entities Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(entities, options) {
				var html = '';
				if (entities.length) {
					for (var i = 0; i < entities.length; i++) {
						var entity = entities[i];
						entity.gateway = options.gateway + getGatewayURL('entity', options.gatewayCatalogId, entity['legacy-id']);
						html += '<li class="acalog-entity">';
							html += '<a class="acalog-entity-link" href="' + entity.gateway + '">' + entity.name + '</a>';
							if (entity.url) {
								entity.api = '/' + entity.url.split('/').slice(3).join('/');
								html += '<div class="acalog-entity-container" data-acalog-ajax="' + entity.api + '" data-acalog-ajax-type="entity">';
									html += options.placeholder;
								html += '</div>';
							} else {
								html += '<div class="acalog-entity-container">';
									html += renderEntity(entity, options);
								html += '</div>';
							}
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-page">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'entity-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-entity-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-entity-open');
						var $entity_body = $(this).next('div.acalog-entity-container');
						if ($entity_body.data('acalog-ajax')) {
							updateData($entity_body, options, function() {
								updatePermalinks($entity_body, options, false);
							});
						}
						var $programs = $(this).next('.acalog-entity-container').children('.acalog-entity-programs');
						if ($programs.attr('data-acalog-ajax')) {
							updateData($programs, options, function () {
								updatePermalinks($programs, options, false);
							});
						}
						var $courses = $(this).next('.acalog-entity-container').children('.acalog-entity-courses');
						if ($courses.attr('data-acalog-ajax')) {
							updateData($courses, options, function () {
								updatePermalinks($courses, options, false);
							});
						}
					});
					$element.on('click', '.acalog-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-course-open');
						var $courseBody = $(this).next('.acalog-course-container').children('.acalog-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
					$element.on('click', '.acalog-program-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-open');
						var $program = $(this).next('.acalog-program-container');
						if ($program.attr('data-acalog-ajax')) {
							updateData($program, options, function () {
								updatePermalinks($program, options, false);
							});
						}
						var $cores = $(this).next('.acalog-program-container').children('.acalog-program-cores');
						if ($cores.attr('data-acalog-ajax')) {
							updateData($cores, options, function () {
								updatePermalinks($cores, options, false);
							});
						}
					});
					$element.on('click', '.acalog-program-core-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-core-course-open');
						var $courseBody = $(this).next('.acalog-program-core-course-container').children('.acalog-program-core-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class EntityLinkWidget
		 * @constructor
		 */
		function EntityLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('entity', options.gatewayCatalogId, legacyItemId);
					text = data[0].name;
				} else {
					Data.reportError(options.api, 'entity-link', $element.prop('outerHTML'));
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class FilterContentWidget
		 * @constructor
		 */
		function FilterContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} filters Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(filters, options) {
				var html = '';
				if (filters.length) {
					var filter = filters[0];
					html += renderFilter(filter, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'filter-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
			};
		}
		/**
		 * Description.
		 *
		 * @class FilterListWidget
		 * @constructor
		 */
		function FilterListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} filters Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(filters, options) {
				var html = '';
				if (filters.length) {
					for (var i = 0; i < filters.length; i++) {
						var filter = filters[i];
						filter.gateway = options.gateway + getGatewayURL('filter', options.gatewayCatalogId, filter['legacy-id']);
						html += '<li class="acalog-filter">';
							html += '<a class="acalog-filter-link" href="' + filter.gateway + '">' + filter.name + '</a>';
							if (filter.url) {
								filter.api = '/' + filter.url.split('/').slice(3).join('/');
								html += '<div class="acalog-filter-container" data-acalog-ajax="' + filter.api + '" data-acalog-ajax-type="filter">';
									html += options.placeholder;
								html += '</div>';
							} else {
								html += '<div class="acalog-filter-container">';
									html += renderFilter(filter, options);
								html += '</div>';
							}
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-page">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'filter-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-filter-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-filter-open');
						var $filter_body = $(this).next('div.acalog-filter-container');
						if ($filter_body.data('acalog-ajax')) {
							updateData($filter_body, options, function() {
								updatePermalinks($filter_body, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class FilterLinkWidget
		 * @constructor
		 */
		function FilterLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('filter', options.gatewayCatalogId, legacyItemId);
					text = data[0].name;
				} else {
					Data.reportError(options.api, 'filter-link', $element.prop('outerHTML'));
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class PageContentWidget
		 * @constructor
		 */
		function PageContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} pages Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(pages, options) {
				var html = '';
				if (pages.length) {
					var page = pages[0];
					html += renderPage(page, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'page-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
			};
		}
		/**
		 * Description.
		 *
		 * @class PageListWidget
		 * @constructor
		 */
		function PageListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} pages Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(pages, options) {
				var html = '';
				if (pages.length) {
					for (var i = 0; i < pages.length; i++) {
						var page = pages[i];
						page.gateway = options.gateway + getGatewayURL('page', options.gatewayCatalogId, page['legacy-id']);
						html += '<li class="acalog-page">';
							html += '<a class="acalog-page-link" href="' + page.gateway + '">' + page.name + '</a>';
							if (page.url) {
								page.api = '/' + page.url.split('/').slice(3).join('/');
								html += '<div class="acalog-page-container" data-acalog-ajax="' + page.api + '" data-acalog-ajax-type="page">';
									html += options.placeholder;
								html += '</div>';
							} else {
								html += '<div class="acalog-page-container">';
									html += renderPage(page, options);
								html += '</div>';
							}
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-page">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'page-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-page-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-page-open');
						var $page_body = $(this).next('div.acalog-page-container');
						if ($page_body.data('acalog-ajax')) {
							updateData($page_body, options, function() {
								updatePermalinks($page_body, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class PageLinkWidget
		 * @constructor
		 */
		function PageLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('page', options.gatewayCatalogId, legacyItemId);
					text = data[0].name;
				} else {
					Data.reportError(options.api, 'page-link', $element.prop('outerHTML'));
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class DegreePlannerContentWidget
		 * @constructor
		 */
		function DegreePlannerContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} program Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(programs, options) {
				var html = '';
				if (programs.length) {
					var program = programs[0];
					html += renderDegreePlanner(program, options);
				} else {
					var href = options.gateway;
					var text = options.gateway;
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
					html += '<a href="' + href + '">' + text + '</a>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'degree-planner-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				var $cores = $element.children('.acalog-program-cores');
				if ($cores.attr('data-acalog-ajax')) {
					updateData($cores, options, function () {
						updatePermalinks($cores, options, false);
					});
				}
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-program-core-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-core-course-open');
						var $courseBody = $(this).next('.acalog-program-core-course-container').children('.acalog-program-core-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class DegreePlannerListWidget
		 * @constructor
		 */
		function DegreePlannerListWidget() {
			/**
			 * Description.
			 *
			 * @param {Array} programs Description.
			 * @param {Object} options Description.
			 * @return {string} html Description.
			 */
			function renderHTML(programs, options) {
				var html = '';
				if (programs.length) {
					for (var i = 0; i < programs.length; i++) {
						var program = programs[i];
						program.gateway = options.gateway + getGatewayURL('degree_planner', options.gatewayCatalogId, program['legacy-id']);
						html += '<li class="acalog-program">';
							html += '<a class="acalog-program-link" href="' + program.gateway + '">' + program.name + '</a>';
							html += '<div class="acalog-program-container">';
								html += renderDegreePlanner(program, options);
							html += '</div>';
						html += '</li>';
					}
				} else {
					html += '<li class="acalog-program">None</li>';
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'degree-planner-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
				updatePermalinks($element, options, false);
				if (options.display === 'dynamic') {
					$element.on('click', '.acalog-program-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-open');
						var $cores = $(this).next('.acalog-program-container').children('.acalog-program-cores');
						if ($cores.attr('data-acalog-ajax')) {
							updateData($cores, options, function () {
								updatePermalinks($cores, options, false);
							});
						}
					});
					$element.on('click', '.acalog-program-core-course-link', function (event) {
						event.preventDefault();
						$(this).parent().toggleClass('acalog-program-core-course-open');
						var $courseBody = $(this).next('.acalog-program-core-course-container').children('.acalog-program-core-course-body');
						if ($courseBody.attr('data-acalog-ajax')) {
							updateData($courseBody, options, function () {
								updatePermalinks($courseBody, options, false);
							});
						}
					});
				}
			};
		}
		/**
		 * Description.
		 *
		 * @class DegreePlannerLinkWidget
		 * @constructor
		 */
		function DegreePlannerLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				var href = options.gateway;
				var text = options.gateway;
				if (data.length) {
					var legacyItemId = data[0]['legacy-id'];
					href += getGatewayURL('degree_planner', options.gatewayCatalogId, legacyItemId);
					text = data[0].name;
				} else {
					Data.reportError(options.api, 'degree-planner-link', $element.prop('outerHTML'));
					if (options.gatewayCatalogId !== null) {
						href += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
						text += getGatewayURL('index', options.gatewayCatalogId, options.gatewayCatalogId);
					}
				}
				if (options.linkText) {
					text = options.linkText;
				}
				$element.prop('href', href);
				$element.text(text);
			};
		}
		/**
		 * Description.
		 *
		 * @class LocationContentWidget
		 * @constructor
		 */
		function LocationContentWidget() {
			/**
			 *
			 * @param locations
			 * @param options
			 * @returns {string}
			 */
			function renderHTML(locations, options) {
				var html = '';
				let location = locations;
				if (locations.length) {
					location = locations[0].location;
				}
				html  += renderLocation(location, options);
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'location-content', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html );
			}
		}
		/**
		 * Description.
		 *
		 * @class LocationListWidget
		 * @constructor
		 */
		function LocationListWidget() {
			/**
			 *
			 * @param locations
			 * @param options
			 * @returns {string}
			 */
			function renderHTML(locations, options) {
				debugger;
				var html = '';
				let location = locations;
				if (!locations.length) {
					location = [locations];
				}
				if (locations.length) {
					for  ( let i = 0; i < locations.length; i++){
						let location = locations[i];
						if (location.location){
							location=location.location;
						}
						html  += renderLocation(location, options);
					}
				}
				return html;
			}
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				if (data.length === 0) {
					Data.reportError(options.api, 'location-list', $element.prop('outerHTML'));
				}
				var html = renderHTML(data, options);
				$element.html(html);
			}
		}
		/**
		 * Description.
		 *
		 * @class UnknownContentWidget
		 * @constructor
		 */
		function UnknownContentWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				Data.reportError(options.api, 'unknown-content', $element.prop('outerHTML'));
				$element.html('<span class="acalog-error">Error</span>');
			};
		}
		/**
		 * Description.
		 *
		 * @class UnknownListWidget
		 * @constructor
		 */
		function UnknownListWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				Data.reportError(options.api, 'unknown-list', $element.prop('outerHTML'));
				$element.html('<li><span class="acalog-error">Error</span></li>');
			};
		}
		/**
		 * Description.
		 *
		 * @class UnknownLinkWidget
		 * @constructor
		 */
		function UnknownLinkWidget() {
			/**
			 * Description.
			 *
			 * @param {Object} $element Description.
			 * @param {Array} data Description.
			 * @param {Object} options Description.
			 * @return {void}
			 */
			this.widgetize = function widgetize($element, data, options) {
				Data.reportError(options.api, 'unknown-link', $element.prop('outerHTML'));
				$element.text('Error');
			};
		}
		return {
			CatalogContentWidget: CatalogContentWidget,
			CatalogListWidget: CatalogListWidget,
			CatalogLinkWidget: CatalogLinkWidget,
			CourseContentWidget: CourseContentWidget,
			CourseListWidget: CourseListWidget,
			CourseLinkWidget: CourseLinkWidget,
			ProgramContentWidget: ProgramContentWidget,
			ProgramListWidget: ProgramListWidget,
			ProgramLinkWidget: ProgramLinkWidget,
			EntityContentWidget: EntityContentWidget,
			EntityListWidget: EntityListWidget,
			EntityLinkWidget: EntityLinkWidget,
			FilterContentWidget: FilterContentWidget,
			FilterListWidget: FilterListWidget,
			FilterLinkWidget: FilterLinkWidget,
			PageContentWidget: PageContentWidget,
			PageListWidget: PageListWidget,
			PageLinkWidget: PageLinkWidget,
			DegreePlannerContentWidget: DegreePlannerContentWidget,
			DegreePlannerListWidget: DegreePlannerListWidget,
			DegreePlannerLinkWidget: DegreePlannerLinkWidget,
			LocationContentWidget: LocationContentWidget,
			LocationListWidget: LocationListWidget,
			UnknownContentWidget: UnknownContentWidget,
			UnknownListWidget: UnknownListWidget,
			UnknownLinkWidget: UnknownLinkWidget,
		};
	})();
	var Data = (function Data() {
		/**
		 * Description.
		 *
		 * @param {string} data Description.
		 * @return {string} data Description.
		 */
		function encodeData(data) {
			return encodeURIComponent(data).replace(/\-/g, '%2D').replace(/\_/g, '%5F').replace(/\./g, '%2E').replace(/\!/g, '%21').replace(/\~/g, '%7E').replace(/\*/g, '%2A').replace(/\'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
		}
		/**
		 * Description.
		 *
		 * @param {string} url Description.
		 * @return {string} url Description.
		 */
		function nextPage(url) {
			var match = url.match(/&page=(\d+)/);
			var pattern = match[0];
			var replacement = '&page=' + (parseInt(match[1]) + 1);
			return url.replace(pattern, replacement);
		}
		var _idName = {
			'course-content': 'courseId',
			'program-content': 'programId',
			'entity-content': 'entityId',
			'filter-content': 'filterId',
			'page-content': 'pageId',
			'degree-planner-content': 'programId',
			'location-content': 'locationId',
		};
		/**
		 * Description.
		 *
		 * @param {string} endpoint Description.
		 * @param {Array} data Description.
		 * @return {Array} data Description.
		 */
		function get(endpoint, _data, widgetType, options, callback) {
			$.ajax({
				url: endpoint
			}).done(function (data) {
				// todo
				if (typeof data.count !== 'undefined') {
					Object.keys(data).forEach(function (key) {
						if (key.indexOf('-list') > -1){
							data.list = data[key];
							delete data[key];
						}
					});
				}
				if (typeof data.count !== 'undefined' && typeof data.list !== 'undefined') {
					_data = _data.concat(data.list);
					if (data.count > _data.length && widgetType.indexOf('list') >= 0) {
						var nextEndpoint = nextPage(endpoint);
						get(nextEndpoint, _data, widgetType, options, callback);
					} else if (_data.length > 0 && widgetType.indexOf('content') >= 0 && endpoint.indexOf('page-size') >= 0) {
						var contentOptions = $.extend(true, {}, options);
						contentOptions[_idName[widgetType]] = _data[0]['id'];
						var contentEndpoint = Utilities.getEndpoint(contentOptions);
						get(contentEndpoint, [], widgetType, contentOptions, callback);
					} else {
						callback(_data, widgetType);
					}
				} else {
					_data.push(data);
					callback(_data, widgetType);
				}
			}).fail(function (jqXHR, textStatus, errorThrown) {
				callback([], widgetType);
			});
		}
		/**
		 * Description.
		 *
		 * @param {Array} data Description.
		 * @param {Object} options Description.
		 * @return {Array} data Description.
		 */
		function fauxFilterData(data, options) {
			if (data.length === 0) {
				return data;
			}
			if (options.data === 'catalogs') {
				for (var catalogIndex = 0; catalogIndex < data.length; catalogIndex++) {
					var catalog = data[catalogIndex];
					if (options.catalogId && catalog.id !== options.catalogId) {
						delete data[catalogIndex];
					}
					if (options.gatewayCatalogId && catalog['legacy-id'] !== options.gatewayCatalogId) {
						delete data[catalogIndex];
					}
				}
				data = data.filter(function(val){return val;});
			}
			return data;
		}
		/**
		 * Description.
		 *
		 * @param {string} api Description.
		 * @param {string} widget Description.
		 * @param {string} error Description.
		 * @return {void}
		 */
		function reportError(api, error, widget) {
			var data = {
				error: error,
				widget: widget,
				location: window.location.href
			};
			$.post(api + '/widget-api/error/', data);
		}
		return {
			encodeData: encodeData,
			get: get,
			fauxFilterData: fauxFilterData,
			reportError: reportError
		};
	})();
	var Utilities = (function() {
		/**
		 * Description.
		 *
		 * @param {Object} options Description.
		 * @return {string} endpoint Description.
		 */
		function getEndpoint(options) {
			var endpoint = options.api + '/widget-api';
			if (options.data === 'catalogs') {
				endpoint += '/catalogs/?page-size=100&page=1';
				if (options.catalogLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.catalogLegacyId);
				}
				if (options.catalogType) {
					endpoint += '&type=' + Data.encodeData(options.catalogType);
				}
				if (options.catalogName) {
					endpoint += '&name=' + Data.encodeData(options.catalogName);
				}
			} else if (options.data === 'courses' && options.courseId) {
				endpoint += '/catalog/' + options.catalogId + '/course/' + options.courseId + '/';
			} else if (options.data === 'courses') {
				endpoint += '/catalog/' + options.catalogId + '/courses/?page-size=100&page=1';
				if (options.courseLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.courseLegacyId);
				}
				if (options.courseType) {
					endpoint += '&type=' + Data.encodeData(options.courseType);
				}
				if (options.coursePrefix) {
					endpoint += '&prefix=' + Data.encodeData(options.coursePrefix);
				}
				if (options.courseCode) {
					endpoint += '&code=' + Data.encodeData(options.courseCode);
				}
				if (options.courseName) {
					endpoint += '&name=' + Data.encodeData(options.courseName);
				}
			} else if (options.data === 'programs' && options.programId) {
				endpoint += '/catalog/' + options.catalogId + '/program/' + options.programId + '/';
			} else if (options.data === 'programs') {
				endpoint += '/catalog/' + options.catalogId + '/programs/?page-size=100&page=1';
				if (options.programLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.programLegacyId);
				}
				if (options.programType) {
					endpoint += '&type=' + Data.encodeData(options.programType);
				}
				if (options.programDegreeType) {
					endpoint += '&degree-type=' + Data.encodeData(options.programDegreeType);
				}
				if (options.programCode) {
					endpoint += '&code=' + Data.encodeData(options.programCode);
				}
				if (options.programName) {
					endpoint += '&name=' + Data.encodeData(options.programName);
				}
			} else if (options.data === 'entities' && options.entityId) {
				endpoint += '/catalog/' + options.catalogId + '/hierarchy/' + options.entityId + '/';
			} else if (options.data === 'entities') {
				endpoint += '/catalog/' + options.catalogId + '/hierarchies/?page-size=100&page=1';
				if (options.entityLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.entityLegacyId);
				}
				if (options.entityType) {
					endpoint += '&type=' + Data.encodeData(options.entityType);
				}
				if (options.entityName) {
					endpoint += '&name=' + Data.encodeData(options.entityName);
				}
			} else if (options.data === 'filters' && options.filterId) {
				endpoint += '/catalog/' + options.catalogId + '/filter/' + options.filterId + '/';
			} else if (options.data === 'filters') {
				endpoint += '/catalog/' + options.catalogId + '/filters/?page-size=100&page=1';
				if (options.filterLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.filterLegacyId);
				}
				if (options.filterName) {
					endpoint += '&name=' + Data.encodeData(options.filterName);
				}
			} else if (options.data === 'pages' && options.pageId) {
				endpoint += '/catalog/' + options.catalogId + '/page/' + options.pageId + '/';
			} else if (options.data === 'pages') {
				endpoint += '/catalog/' + options.catalogId + '/pages/?page-size=100&page=1';
				if (options.pageLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.pageLegacyId);
				}
				if (options.pageName) {
					endpoint += '&name=' + Data.encodeData(options.pageName);
				}
			} else if (options.data === 'degree_planner' && options.programId) {
				endpoint += '/catalog/' + options.catalogId + '/program/' + options.programId + '/';
			} else if (options.data === 'degree_planner') {
				endpoint += '/catalog/' + options.catalogId + '/programs/?page-size=100&page=1';
				if (options.programLegacyId) {
					endpoint += '&legacy-id=' + Data.encodeData(options.programLegacyId);
				}
				if (options.programType) {
					endpoint += '&type=' + Data.encodeData(options.programType);
				}
				if (options.programDegreeType) {
					endpoint += '&degree-type=' + Data.encodeData(options.programDegreeType);
				}
				if (options.programCode) {
					endpoint += '&code=' + Data.encodeData(options.programCode);
				}
				if (options.programName) {
					endpoint += '&name=' + Data.encodeData(options.programName);
				}
			} else if (options.data === 'location' || options.data === 'locations') {
				if (options.locationId){
					endpoint += '/catalog/' + options.catalogId + '/location/' + options.locationId;
				} else {
					endpoint += '/catalog/' + options.catalogId + '/locations/?page-size=100&page=1';
					if (options.locationLegacyId) {
						endpoint += '&legacy-id=' + Data.encodeData(options.locationLegacyId);
					}
				}
			}
			return endpoint;
		}
		/**
		 * Description.
		 *
		 * @param {Object} $element Description.
		 * @param {Object} options Description.
		 * @return {string} widgetType Description.
		 */
		function getWidgetType($element, options) {
			var widgetType = null;
			if ($element.is('a')) {
				if (options.data === 'catalogs') {
					widgetType = 'catalog-link';
				} else if (options.data === 'courses') {
					widgetType = 'course-link';
				} else if (options.data === 'programs') {
					widgetType = 'program-link';
				} else if (options.data === 'entities') {
					widgetType = 'entity-link';
				} else if (options.data === 'filters') {
					widgetType = 'filter-link';
				} else if (options.data === 'pages') {
					widgetType = 'page-link';
				} else if (options.data === 'degree_planner') {
					widgetType = 'degree-planner-link';
				} else {
					widgetType = 'unknown-link';
				}
			} else if ($element.is('ul')) {
				if (options.data === 'catalogs') {
					widgetType = 'catalog-list';
				} else if (options.data === 'courses') {
					widgetType = 'course-list';
				} else if (options.data === 'programs') {
					widgetType = 'program-list';
				} else if (options.data === 'entities') {
					widgetType = 'entity-list';
				} else if (options.data === 'filters') {
					widgetType = 'filter-list';
				} else if (options.data === 'pages') {
					widgetType = 'page-list';
				} else if (options.data === 'degree_planner') {
					widgetType = 'degree-planner-list';
				} else if (options.data === 'location'  || options.data === 'locations') {
					widgetType = 'location-list';
				} else {
					widgetType = 'unknown-list';
				}
			} else {
				if (options.data === 'catalogs') {
					widgetType = 'catalog-content';
				} else if (options.data === 'courses') {
					widgetType = 'course-content';
				} else if (options.data === 'programs') {
					widgetType = 'program-content';
				} else if (options.data === 'entities') {
					widgetType = 'entity-content';
				} else if (options.data === 'filters') {
					widgetType = 'filter-content';
				} else if (options.data === 'pages') {
					widgetType = 'page-content';
				} else if (options.data === 'degree_planner') {
					widgetType = 'degree-planner-content';
				} else if (options.data === 'location'  || options.data === 'locations') {
					widgetType = 'location-content';
				} else {
					widgetType = 'unknown-content';
				}
			}
			return widgetType;
		}
		return {
			getEndpoint: getEndpoint,
			getWidgetType: getWidgetType
		};
	})();
	/**
	 * Description.
	 *
	 * @class AcalogWidgetAPI
	 * @constructor
	 */
	var AcalogWidgetAPI = function AcalogWidgetAPI(elements, _options, _classCallback) {
		var acalog = this;
		/**
		 * Description.
		 *
		 * @type {Object}
		 */
		_options = typeof _options !== 'undefined' ? _options : {};
		_options.api = typeof _options.api !== 'undefined' ? _options.api : null;
		_options.gateway = typeof _options.gateway !== 'undefined' ? _options.gateway : null;
		_options.api = _options.api !== null ? _options.api : _options.gateway;
		/**
		 * Description.
		 *
		 * @type {Array}
		 */
		var _catalogs = [];
		/**
		 * Description.
		 *
		 * @type {Object}
		 */
		var _widgets = {
			'catalog-content': Widgets.CatalogContentWidget,
			'catalog-list': Widgets.CatalogListWidget,
			'catalog-link': Widgets.CatalogLinkWidget,
			'course-content': Widgets.CourseContentWidget,
			'course-list': Widgets.CourseListWidget,
			'course-link': Widgets.CourseLinkWidget,
			'program-content': Widgets.ProgramContentWidget,
			'program-list': Widgets.ProgramListWidget,
			'program-link': Widgets.ProgramLinkWidget,
			'entity-content': Widgets.EntityContentWidget,
			'entity-list': Widgets.EntityListWidget,
			'entity-link': Widgets.EntityLinkWidget,
			'filter-content': Widgets.FilterContentWidget,
			'filter-list': Widgets.FilterListWidget,
			'filter-link': Widgets.FilterLinkWidget,
			'page-content': Widgets.PageContentWidget,
			'page-list': Widgets.PageListWidget,
			'page-link': Widgets.PageLinkWidget,
			'degree-planner-content': Widgets.DegreePlannerContentWidget,
			'degree-planner-list': Widgets.DegreePlannerListWidget,
			'degree-planner-link': Widgets.DegreePlannerLinkWidget,
			'location-content': Widgets.LocationContentWidget,
			'location-list': Widgets.LocationListWidget,
			'unknown-content': Widgets.UnknownContentWidget,
			'unknown-list': Widgets.UnknownListWidget,
			'unknown-link': Widgets.UnknownLinkWidget
		};
		/**
		 * Description.
		 *
		 * @return {Object} globalOptions Description.
		 */
		function getGlobalOptions() {
			var globalOptions = {};
			if (_options.api) {
				globalOptions.api = _options.api;
			}
			if (_options.gateway) {
				globalOptions.gateway = _options.gateway;
			}
			if (_options.data) {
				globalOptions.data = _options.data;
			}
			if (_options.catalogId) {
				globalOptions.catalogId = _options.catalogId;
			}
			if (_options.gatewayCatalogId) {
				globalOptions.catalogLegacyId = _options.gatewayCatalogId;
			}
			if (_options.catalogType) {
				globalOptions.catalogType = _options.catalogType;
			}
			if (_options.catalogName) {
				globalOptions.catalogName = _options.catalogName;
			}
			if (_options.courseId) {
				globalOptions.courseId = _options.courseId;
			}
			if (_options.courseLegacyId) {
				globalOptions.courseLegacyId = _options.courseLegacyId;
			}
			if (_options.courseType) {
				globalOptions.courseType = _options.courseType;
			}
			if (_options.coursePrefix) {
				globalOptions.coursePrefix = _options.coursePrefix;
			}
			if (_options.courseCode) {
				globalOptions.courseCode = _options.courseCode;
			}
			if (_options.courseName) {
				globalOptions.courseName = _options.courseName;
			}
			if (_options.programId) {
				globalOptions.programId = _options.programId;
			}
			if (_options.programLegacyId) {
				globalOptions.programLegacyId = _options.programLegacyId;
			}
			if (_options.programType) {
				globalOptions.programType = _options.programType;
			}
			if (_options.programDegreeType) {
				globalOptions.programDegreeType = _options.programDegreeType;
			}
			if (_options.programCode) {
				globalOptions.programCode = _options.programCode;
			}
			if (_options.programName) {
				globalOptions.programName = _options.programName;
			}
			if (_options.entityId) {
				globalOptions.entityId = _options.entityId;
			}
			if (_options.entityLegacyId) {
				globalOptions.entityLegacyId = _options.entityLegacyId;
			}
			if (_options.entityType) {
				globalOptions.entityType = _options.entityType;
			}
			if (_options.entityName) {
				globalOptions.entityName = _options.entityName;
			}
			if (_options.filterId) {
				globalOptions.filterId = _options.filterId;
			}
			if (_options.filterLegacyId) {
				globalOptions.filterLegacyId = _options.filterLegacyId;
			}
			if (_options.filterName) {
				globalOptions.filterName = _options.filterName;
			}
			if (_options.pageId) {
				globalOptions.pageId = _options.pageId;
			}
			if (_options.pageLegacyId) {
				globalOptions.pageLegacyId = _options.pageLegacyId;
			}
			if (_options.pageName) {
				globalOptions.pageName = _options.pageName;
			}
			if (_options.display) {
				globalOptions.display = _options.display;
			}
			if (_options.linkText) {
				globalOptions.linkText = _options.linkText;
			}
			return globalOptions;
		}
		/**
		 * Description.
		 *
		 * @param {Object} $element Description.
		 * @return {Object} elementOptions Description.
		 */
		function getElementOptions($element) {
			var elementOptions = {};
			var dataAttributes = $element.data();
			if (dataAttributes.acalogData) {
				elementOptions.data = dataAttributes.acalogData;
			}
			if (dataAttributes.acalogCatalogId) {
				elementOptions.catalogId = dataAttributes.acalogCatalogId;
			}
			if (dataAttributes.acalogCatalogLegacyId) {
				elementOptions.catalogLegacyId = dataAttributes.acalogCatalogLegacyId;
			}
			if (dataAttributes.acalogCatalogType) {
				elementOptions.catalogType = dataAttributes.acalogCatalogType;
			}
			if (dataAttributes.acalogCatalogName) {
				elementOptions.catalogName = dataAttributes.acalogCatalogName;
			}
			if (dataAttributes.acalogCourseId) {
				elementOptions.courseId = dataAttributes.acalogCourseId;
			}
			if (dataAttributes.acalogCourseLegacyId) {
				elementOptions.courseLegacyId = dataAttributes.acalogCourseLegacyId;
			}
			if (dataAttributes.acalogCourseType) {
				elementOptions.courseType = dataAttributes.acalogCourseType;
			}
			if (dataAttributes.acalogCoursePrefix) {
				elementOptions.coursePrefix = dataAttributes.acalogCoursePrefix;
			}
			if (dataAttributes.acalogCourseCode) {
				elementOptions.courseCode = dataAttributes.acalogCourseCode;
			}
			if (dataAttributes.acalogCourseName) {
				elementOptions.courseName = dataAttributes.acalogCourseName;
			}
			if (dataAttributes.acalogProgramId) {
				elementOptions.programId = dataAttributes.acalogProgramId;
			}
			if (dataAttributes.acalogProgramLegacyId) {
				elementOptions.programLegacyId = dataAttributes.acalogProgramLegacyId;
			}
			if (dataAttributes.acalogProgramType) {
				elementOptions.programType = dataAttributes.acalogProgramType;
			}
			if (dataAttributes.acalogProgramDegreeType) {
				elementOptions.programDegreeType = dataAttributes.acalogProgramDegreeType;
			}
			if (dataAttributes.acalogProgramCode) {
				elementOptions.programCode = dataAttributes.acalogProgramCode;
			}
			if (dataAttributes.acalogProgramName) {
				elementOptions.programName = dataAttributes.acalogProgramName;
			}
			if (dataAttributes.acalogEntityId) {
				elementOptions.entityId = dataAttributes.acalogEntityId;
			}
			if (dataAttributes.acalogEntityLegacyId) {
				elementOptions.entityLegacyId = dataAttributes.acalogEntityLegacyId;
			}
			if (dataAttributes.acalogEntityType) {
				elementOptions.entityType = dataAttributes.acalogEntityType;
			}
			if (dataAttributes.acalogEntityName) {
				elementOptions.entityName = dataAttributes.acalogEntityName;
			}
			if (dataAttributes.acalogFilterId) {
				elementOptions.filterId = dataAttributes.acalogFilterId;
			}
			if (dataAttributes.acalogFilterLegacyId) {
				elementOptions.filterLegacyId = dataAttributes.acalogFilterLegacyId;
			}
			if (dataAttributes.acalogFilterName) {
				elementOptions.filterName = dataAttributes.acalogFilterName;
			}
			if (dataAttributes.acalogPageId) {
				elementOptions.pageId = dataAttributes.acalogPageId;
			}
			if (dataAttributes.acalogPageLegacyId) {
				elementOptions.pageLegacyId = dataAttributes.acalogPageLegacyId;
			}
			if (dataAttributes.acalogPageName) {
				elementOptions.pageName = dataAttributes.acalogPageName;
			}
			if (dataAttributes.acalogLocationId) {
				elementOptions.locationId = dataAttributes.acalogLocationId;
			}
			if (dataAttributes.acalogLocationLegacyId) {
				elementOptions.locationLegacyId = dataAttributes.acalogLocationLegacyId;
			}
			if (dataAttributes.acalogLocationName) {
				elementOptions.locationName = dataAttributes.acalogLocationName;
			}
			if (dataAttributes.acalogDisplay) {
				elementOptions.display = dataAttributes.acalogDisplay;
			}
			if ($element.is('ul')) {
				elementOptions.placeholder = $element.children('li').html();
			} else {
				elementOptions.placeholder = $element.html();
			}
			if (dataAttributes.acalogLinkText) {
				elementOptions.linkText = dataAttributes.acalogLinkText;
			}
			return elementOptions;
		}
		/**
		 * Description.
		 *
		 * @param {Array} catalogs Description.
		 * @param {number} catalogLegacyId Description.
		 * @return {Array} catalogs Description.
		 */
		function getCatalogIdByCatalogLegacyId(catalogs, catalogLegacyId) {
			var catalogId = null;
			for (var i = 0; i < catalogs.length; i++) {
				var catalog = catalogs[i];
				if (catalog['legacy-id'] === catalogLegacyId) {
					catalogId = catalog.id;
				}
			}
			return catalogId;
		}
		/**
		 * Description.
		 *
		 * @param {Array} catalogs Description.
		 * @param {string} type Description.
		 * @return {number} catalogId Description.
		 */
		function getCatalogIdByType(catalogs, type) {
			var catalogId = null;
			for (var i = 0; i < catalogs.length; i++) {
				var catalog = catalogs[i];
				if (catalog.archived === false && catalog['catalog-type'].name === type) {
					catalogId = catalog.id;
				}
			}
			return catalogId;
		}
		/**
		 * Description.
		 *
		 * @param {Array} catalogs Description.
		 * @param {string} name Description.
		 * @return {number} catalogId Description.
		 */
		function getCatalogIdByName(catalogs, name) {
			var catalogId = null;
			for (var i = 0; i < catalogs.length; i++) {
				var catalog = catalogs[i];
				if (catalog.name === name) {
					catalogId = catalog.id;
				}
			}
			return catalogId;
		}
		/**
		 * Description.
		 *
		 * @param {Array} catalogs Description.
		 * @param {number} catalogId Description.
		 * @return {Array} catalogs Description.
		 */
		function getGatewayCatalogId(catalogs, catalogId) {
			var gatewayCatalogId = null;
			for (var i = 0; i < catalogs.length; i++) {
				var catalog = catalogs[i];
				if (catalog.id === catalogId) {
					gatewayCatalogId = catalog['legacy-id'];
				}
			}
			return gatewayCatalogId;
		}
		/**
		 * Description.
		 *
		 * @param {Object} globalOptions Description.
		 * @param {Object} elementOptions Description.
		 * @return {Object} options Description.
		 */
		function mergeOptions(globalOptions, elementOptions) {
			var options = $.extend({}, globalOptions, elementOptions);
			if (options.catalogLegacyId && options.data !== 'catalogs') {
				options.catalogId = getCatalogIdByCatalogLegacyId(_catalogs, options.catalogLegacyId);
				delete options.catalogLegacyId;
			}
			if (options.catalogType && options.data !== 'catalogs') {
				options.catalogId = getCatalogIdByType(_catalogs, options.catalogType);
				delete options.catalogType;
			}
			if (options.catalogName && options.data !== 'catalogs') {
				options.catalogId = getCatalogIdByName(_catalogs, options.catalogName);
				delete options.catalogName;
			}
			if (typeof options.catalogId === 'undefined') {
				options.catalogId = null;
			}
			options.gatewayCatalogId = getGatewayCatalogId(_catalogs, options.catalogId);
			return options;
		}
		/**
		 * Description.
		 *
		 * @param {Object} $element Description.
		 * @return {void}
		 */
		this.widgetize = function widgetize($element) {
			var widget;
			var globalOptions = getGlobalOptions();
			var elementOptions = getElementOptions($element);
			var options = mergeOptions(globalOptions, elementOptions);
			var endpoint = Utilities.getEndpoint(options);
			var widgetType = Utilities.getWidgetType($element, options);
			Data.get(endpoint, [], widgetType, options, function (data, widgetType) {
				data = Data.fauxFilterData(data, options);
				widget = new _widgets[widgetType]();
				widget.widgetize($element, data, options);
			});
		};
		if (elements.length > 0) {
			Data.get(_options.api + '/widget-api/catalogs/', [], 'list', _options, function (catalogs, widgetType) {
				_catalogs = catalogs !== null ? catalogs: [];
				_classCallback(acalog);
			});
		}
	};
	return AcalogWidgetAPI;
}(jQuery));
