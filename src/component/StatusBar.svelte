<script lang="ts">
    type props = {
        progress?: number,
        progresscolor?: string,
        backcolor?: string,
        forecolor?: string,
        message?: string
    }
    const {
        progress = 0,
        progresscolor: progersscolor = 'green',
        backcolor = 'white',
        forecolor = 'black',
        message = ''
    }: props = $props();
</script>

<div style:background-color={backcolor} style:position="relative" style:z-index="0">
<div class="a"
style:width="{progress}%"
style:background-color={progersscolor}
></div>
<center style:color={forecolor}>{message}</center>
</div>
<style>
    .a {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        z-index: -1;
    }
</style>
