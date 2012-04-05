// A powerset function from rosettacode.org

function powerset(ary) {
    var ps = new Array(new Array());
    for (var i=0; i < ary.length; i++) {
        // we modify the ps array in the next loop,
        // so can't use the ps.length property directly in the loop condition.
        var current_length = ps.length;
        for (var j = 0; j < current_length; j++) {
            ps.push(ps[j].concat(ary[i]));
        }
    }
    return ps;
}

