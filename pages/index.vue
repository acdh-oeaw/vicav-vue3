<script setup lang="ts">
const { $api } = useNuxtApp();

let projectInfo = await $api.project.getProject({mode: "no-cors", headers: { ACCEPT: "application/json" }});

</script>
<template>
  <nav class="navbar navbar-expand-md navbar-dark fixed-top">
    <div class="container-fluid">
      <a class="navbar-brand mr-0 mr-md-2" aria-label="Vicav" href="/"><img alt="logo" src="~/assets/vicav_logo.svg"></a>
    </div>
  </nav>
  <div>
    This is becoming VICAV on Nuxt.
    <p>{{ JSON.stringify(projectInfo.data) }}</p>
  </div>
  <footer class="main-footer">
    <div class="container-fluid">
      <div class="footer-wrapper">
        <div class="footer-sep">
          <i aria-hidden="true" class="fa fa-comment-o"></i> CONTACT
        </div>
        <div class="el-block col-md-1 first">
          <a href="https://www.oeaw.ac.at/acdh/acdh-home/" target="_blank" rel="noopener" aria-label="ACDH">
            <img class="footer-acdh-logo" src="~/assets/acdh_noText_white.svg" alt="ACDH" title="Austrian Center for Digital Humanities">
          </a>
        </div>
        <div class="el-block col-md-4">
          <div class="csc-textpic-text">
            <p class="bodytext">ACDH-CH<br>
              Austrian Centre for Digital Humanities and Cultural Heritage<br>
              Austrian Academy of Sciences</p>
            <p class="bodytext">Sonnenfelsgasse 19<br>
              1010 Vienna</p>
            <p class="bodytext">T: +43 1 51581-2200<br>
              E: <a href="mailto:acdh-ch@oeaw.ac.at" style="font-weight:600;">acdh-ch(at)oeaw.ac.at</a></p>
          </div>
        </div>
        <div class="el-block col-md-3 last">
          <h3>HELPDESK</h3>
          <p class="bodytext">ACDH runs a helpdesk offering advice for questions related to various digital humanities topics.</p>
          <p class="bodytext"><a class="helpdesk-button" href="mailto:acdh@oeaw.ac.at">ASK US!</a></p>
        </div>
      </div>
    </div>
    <div class="footer-imprint-bar">
      © Copyright OEAW | <a target="_blank" href="https://www.oeaw.ac.at/oeaw/impressum/">Impressum/Imprint</a>
    </div>
  </footer>
</template>
