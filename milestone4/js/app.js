$(function () {
  const API_KEY = "10348c7a1609123b48827fd4d694d7c4";
  const BASE = "https://api.themoviedb.org/3";

  let currentPage = 1;
  let totalPages = 1;
  let currentQuery = "";
  let viewMode = "grid";

  const $searchForm = $("#search-form");
  const $searchInput = $("#search-input");
  const $searchStatus = $("#search-status");
  const $searchResults = $("#search-results");
  const $pagination = $("#pagination");
  const $pageIndicator = $("#page-indicator");
  const $prevPage = $("#prev-page");
  const $nextPage = $("#next-page");
  const $details = $("#details-content");
  const $collectionResults = $("#collection-results");
  const $collectionStatus = $("#collection-status");

  const cardTemplate = $("#movie-card-template").html();
  const detailsTemplate = $("#movie-details-template").html();

  function setStatus(msg) {
    $searchStatus.text(msg);
  }

  function renderResults(movies) {
    const html = Mustache.render(cardTemplate, { movies: movies });
    $searchResults.html(html);
    $searchResults.removeClass("grid-view list-view").addClass(viewMode + "-view");
  }

  function search(query, page = 1) {
    if (!query) {
      setStatus("Enter a title or keyword.");
      return;
    }
    currentQuery = query;
    currentPage = page;
    setStatus("Searching…");
    $searchResults.empty();
    $pagination.prop("hidden", true);

    $.ajax({
      url: `${BASE}/search/movie`,
      data: {
        api_key: API_KEY,
        query: query,
        page: page,
        include_adult: false
      }
    })
    .done(function (data) {
      const movies = (data.results || []).map(m => ({
        ...m,
        release_year: m.release_date ? m.release_date.slice(0, 4) : "N/A",
        vote_average: m.vote_average ? m.vote_average.toFixed(1) : "—"
      }));

      totalPages = data.total_pages || 1;

      if (movies.length === 0) {
        setStatus(`No results for “${query}”.`);
        return;
      }

      renderResults(movies);
      setStatus(`Showing page ${page} of ${totalPages} for “${query}”.`);

      $pageIndicator.text(`Page ${page} of ${totalPages}`);
      $pagination.prop("hidden", totalPages <= 1);
      $prevPage.prop("disabled", page <= 1);
      $nextPage.prop("disabled", page >= totalPages);
    })
    .fail(function () {
      setStatus("Search failed. Check your connection or API key.");
    });
  }

  function loadDetails(id) {
    $details.html('<p class="status">Loading details…</p>');

    $.ajax({
      url: `${BASE}/movie/${id}`,
      data: { api_key: API_KEY }
    })
    .done(function (movie) {
      const html = Mustache.render(detailsTemplate, {
        ...movie,
        runtime: movie.runtime || "N/A",
        original_language: (movie.original_language || "").toUpperCase()
      });
      $details.html(html);
    })
    .fail(function () {
      $details.html('<p class="status error">Could not load details. Try again.</p>');
    });
  }

  function loadCollection(type) {
    $collectionStatus.text("Loading…");
    $collectionResults.empty();

    const endpoint = type === "popular" ? "/movie/popular" : "/movie/top_rated";

    $.ajax({
      url: BASE + endpoint,
      data: { api_key: API_KEY, page: 1 }
    })
    .done(function (data) {
      const movies = (data.results || []).slice(0, 10).map(m => ({
        ...m,
        release_year: m.release_date ? m.release_date.slice(0, 4) : "N/A",
        vote_average: m.vote_average ? m.vote_average.toFixed(1) : "—"
      }));

      if (movies.length === 0) {
        $collectionStatus.text("No movies available.");
        return;
      }

      const html = Mustache.render(cardTemplate, { movies: movies });
      $collectionResults.html(html);
      $collectionResults.removeClass("grid-view list-view").addClass(viewMode + "-view");
      $collectionStatus.text(type === "popular" ? "Popular movies" : "Top rated movies");
    })
    .fail(function () {
      $collectionStatus.text("Could not load collection.");
    });
  }

  $searchForm.on("submit", function (e) {
    e.preventDefault();
    const q = $.trim($searchInput.val());
    search(q, 1);
  });

  $prevPage.on("click", () => search(currentQuery, currentPage - 1));
  $nextPage.on("click", () => search(currentQuery, currentPage + 1));

  $("#grid-view").on("click", function () {
    viewMode = "grid";
    $(this).addClass("active");
    $("#list-view").removeClass("active");
    $searchResults.removeClass("list-view").addClass("grid-view");
    $collectionResults.removeClass("list-view").addClass("grid-view");
  });

  $("#list-view").on("click", function () {
    viewMode = "list";
    $(this).addClass("active");
    $("#grid-view").removeClass("active");
    $searchResults.removeClass("grid-view").addClass("list-view");
    $collectionResults.removeClass("grid-view").addClass("list-view");
  });

  $searchResults.on("click", ".movie-select", function () {
    const id = $(this).closest(".movie-card").data("id");
    loadDetails(id);
  });

  $("#tab-popular").on("click", function () {
    $(this).addClass("active");
    $("#tab-top-rated").removeClass("active");
    loadCollection("popular");
  });

  $("#tab-top-rated").on("click", function () {
    $(this).addClass("active");
    $("#tab-popular").removeClass("active");
    loadCollection("top_rated");
  });

  $collectionResults.on("click", ".movie-select", function () {
    const id = $(this).closest(".movie-card").data("id");
    loadDetails(id);
  });

  loadCollection("popular");
});
