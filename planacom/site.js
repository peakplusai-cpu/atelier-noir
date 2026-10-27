(function () {
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  var button = document.querySelector("[data-copy-line]");
  var status = document.querySelector("[data-copy-status]");
  var idNode = document.querySelector("#line-id");
  if (!button || !status || !idNode) return;

  var label = button.textContent;

  button.addEventListener("click", function () {
    var id = (idNode.textContent || "").trim();

    function finish(ok) {
      status.textContent = ok ? "已複製 LINE ID：" + id : "請直接選取 LINE ID：" + id;
      button.textContent = ok ? "已複製" : label;
      window.setTimeout(function () {
        button.textContent = label;
      }, 2000);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(
        function () {
          finish(true);
        },
        function () {
          finish(false);
        }
      );
      return;
    }

    finish(false);
  });
})();
